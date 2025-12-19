import base64
import json
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

import sentry_sdk
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from PIL import Image
from pillow_heif import register_heif_opener
from pydantic import BaseModel, field_validator
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sqlalchemy import text
from sqlalchemy.orm import Session

# Register HEIF opener so PIL can handle HEIC files
register_heif_opener()

from slowapi.errors import RateLimitExceeded

from admin import router as admin_router
from auth import get_current_user, get_optional_user
from auth_endpoints import router as auth_router
from database import Asset, Credit, Job, JobEvent, JobStatus, Shoot, User, get_db
from logger import LoggingMiddleware, logger
from rate_limiter import RATE_LIMITS, limiter, rate_limit_exceeded_handler
from revenue_cat import router as revenuecat_router
from schemas import validate_uuid

# Import R2 client for presigned URLs
try:
    from s3_client import r2_client

    R2_ENABLED = True
    logger.info("R2 client initialized successfully")
except Exception as e:
    R2_ENABLED = False
    logger.warning(f"R2 client not available: {e}")

load_dotenv()

# Initialize Sentry
sentry_dsn = os.getenv("SENTRY_DSN")
if sentry_dsn:
    sentry_sdk.init(
        dsn=sentry_dsn,
        integrations=[
            FastApiIntegration(auto_enabling_integrations=True),
            SqlalchemyIntegration(),
        ],
        # Adjust sampling rate based on environment
        traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.25")),
        environment=os.getenv("ENVIRONMENT", "development"),
        release=os.getenv("APP_VERSION", "1.0.0"),
        # Additional performance monitoring configuration
        profiles_sample_rate=0.1,  # Profile 10% of transactions
        send_default_pii=False,  # Don't send personally identifiable information
    )
    logger.info(
        f"Sentry initialized with {os.getenv('SENTRY_TRACES_SAMPLE_RATE', '0.25')} trace sampling"
    )
else:
    logger.warning("SENTRY_DSN not set, Sentry not initialized")

app = FastAPI(title="Luster AI API", version="1.0.0")

# Add rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# Include routers
app.include_router(auth_router)  # Authentication endpoints
app.include_router(admin_router)  # Admin monitoring
app.include_router(revenuecat_router)  # RevenueCat webhooks

# Add structured logging middleware
app.add_middleware(LoggingMiddleware)

# CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for mobile development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Convert to absolute paths to avoid issues with relative paths
UPLOADS_DIR = os.path.abspath(os.getenv("UPLOADS_DIR", "../../uploads"))
OUTPUTS_DIR = os.path.abspath(os.getenv("OUTPUTS_DIR", "../../outputs"))

# Ensure directories exist
Path(UPLOADS_DIR).mkdir(parents=True, exist_ok=True)
Path(OUTPUTS_DIR).mkdir(parents=True, exist_ok=True)

# Default user ID for local development (matches schema.sql)
# Using string format since UUIDType is now String(36) for SQLite compatibility
DEFAULT_USER_ID = "550e8400-e29b-41d4-a716-446655440000"


def validate_path_uuid(value: str, param_name: str = "id") -> str:
    """Validate a path parameter is a valid UUID and return it."""
    try:
        return validate_uuid(value)
    except ValueError:
        raise HTTPException(
            status_code=400, detail=f"Invalid {param_name}: must be a valid UUID"
        )


def convert_to_jpg(input_path: str, output_path: str, quality: int = 95) -> None:
    """
    Convert any image format (including HEIC) to JPG.

    Args:
        input_path: Path to input image (can be HEIC, PNG, etc.)
        output_path: Path where JPG should be saved
        quality: JPG quality (1-100, default 95)
    """
    try:
        # Open image (PIL will use HEIF opener for HEIC files)
        with Image.open(input_path) as img:
            # Convert to RGB if needed (RGBA, P, etc.)
            if img.mode in ("RGBA", "LA", "P"):
                # Create white background for transparency
                background = Image.new("RGB", img.size, (255, 255, 255))
                if img.mode == "P":
                    img = img.convert("RGBA")
                background.paste(
                    img, mask=img.split()[-1] if img.mode in ("RGBA", "LA") else None
                )
                img = background
            elif img.mode != "RGB":
                img = img.convert("RGB")

            # Save as JPG
            img.save(output_path, "JPEG", quality=quality, optimize=True)
            print(f"Converted {input_path} to JPG: {output_path}")
    except Exception as e:
        print(f"Error converting image: {e}")
        raise HTTPException(
            status_code=400, detail=f"Failed to process image: {str(e)}"
        )


# Pydantic models for mobile API with validation
class Base64ImageRequest(BaseModel):
    """Request schema for base64 image upload with validation."""

    image: str  # Base64 encoded image
    style: str = "luster"
    project_name: Optional[str] = None
    shoot_id: Optional[str] = None
    credit_cost: int = 1  # Credit cost per photo (flexible pricing)

    @field_validator("image")
    @classmethod
    def validate_image(cls, v: str) -> str:
        if len(v) < 100:
            raise ValueError("Image data too short - invalid base64")
        return v

    @field_validator("style")
    @classmethod
    def validate_style(cls, v: str) -> str:
        allowed = {"luster", "flambient"}
        if v not in allowed:
            raise ValueError(f"Style must be one of: {', '.join(allowed)}")
        return v

    @field_validator("shoot_id")
    @classmethod
    def validate_shoot_id(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return validate_uuid(v)
        return v


@app.get("/health")
def health_check():
    """Health check endpoint with database status"""
    health_status = {"status": "healthy", "services": {}}

    # Check database
    try:
        from database import SessionLocal

        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        health_status["services"]["database"] = "healthy"
    except Exception as e:
        health_status["services"]["database"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"

    # Check R2 storage
    health_status["services"]["r2_storage"] = "enabled" if R2_ENABLED else "disabled"

    return health_status


# ============================================================================
# R2 Presigned URL Endpoints
# ============================================================================


class PresignedUploadRequest(BaseModel):
    """Request schema for presigned upload URL with validation."""

    shoot_id: str
    filename: str
    content_type: str = "image/jpeg"
    max_file_size: int = 10 * 1024 * 1024  # 10MB default

    @field_validator("shoot_id")
    @classmethod
    def validate_shoot_id(cls, v: str) -> str:
        return validate_uuid(v)

    @field_validator("filename")
    @classmethod
    def validate_filename(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Filename cannot be empty")
        if len(v) > 255:
            raise ValueError("Filename too long (max 255 characters)")
        return v.strip()

    @field_validator("max_file_size")
    @classmethod
    def validate_max_file_size(cls, v: int) -> int:
        if v < 1:
            raise ValueError("File size must be positive")
        if v > 50 * 1024 * 1024:  # 50MB max
            raise ValueError("File size too large (max 50MB)")
        return v


@app.post("/uploads/presign")
def generate_presigned_upload(
    request: PresignedUploadRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Generate presigned POST URL for direct client uploads to R2

    This allows mobile/web clients to upload directly to R2 without
    going through the API server, which is more efficient and scalable.
    """
    if not R2_ENABLED:
        raise HTTPException(
            status_code=503,
            detail="R2 storage not configured. Please set R2 environment variables.",
        )

    # Validate shoot exists and belongs to user
    shoot = (
        db.query(Shoot)
        .filter(Shoot.id == request.shoot_id, Shoot.user_id == user.id)
        .first()
    )
    if not shoot:
        raise HTTPException(status_code=404, detail="Shoot not found")

    # Generate unique asset ID and object key
    asset_id = str(uuid.uuid4())
    file_ext = os.path.splitext(request.filename)[1] or ".jpg"

    # R2 object key format: /{userId}/{shootId}/{assetId}/original{ext}
    object_key = f"{user.id}/{request.shoot_id}/{asset_id}/original{file_ext}"

    try:
        # Generate presigned POST URL
        presigned_data = r2_client.generate_presigned_upload_url(
            object_key=object_key,
            content_type=request.content_type,
            expiration=3600,  # 1 hour
            max_file_size=request.max_file_size,
        )

        logger.info(f"Generated presigned upload URL for shoot {request.shoot_id}")

        return {
            "asset_id": asset_id,
            "object_key": object_key,
            "upload_url": presigned_data["url"],
            "upload_fields": presigned_data["fields"],
            "expires_in": 3600,
        }

    except Exception as e:
        logger.error(f"Failed to generate presigned upload URL: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to generate upload URL: {str(e)}"
        )


class ConfirmUploadRequest(BaseModel):
    """Request schema for confirming upload with validation."""

    asset_id: str
    shoot_id: str
    object_key: str
    filename: str
    file_size: int
    content_type: str = "image/jpeg"

    @field_validator("asset_id", "shoot_id")
    @classmethod
    def validate_uuids(cls, v: str) -> str:
        return validate_uuid(v)

    @field_validator("file_size")
    @classmethod
    def validate_file_size(cls, v: int) -> int:
        if v < 1:
            raise ValueError("File size must be positive")
        if v > 50 * 1024 * 1024:
            raise ValueError("File size too large (max 50MB)")
        return v


@app.post("/uploads/confirm")
def confirm_upload(
    request: ConfirmUploadRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Confirm that a file was uploaded to R2 and create the asset record

    After the client uploads directly to R2 using a presigned URL,
    they call this endpoint to register the asset in the database.
    """
    if not R2_ENABLED:
        raise HTTPException(status_code=503, detail="R2 storage not configured")

    # Validate shoot exists and belongs to user
    shoot = (
        db.query(Shoot)
        .filter(Shoot.id == request.shoot_id, Shoot.user_id == user.id)
        .first()
    )
    if not shoot:
        raise HTTPException(status_code=404, detail="Shoot not found")

    # Verify the file exists in R2
    try:
        if not r2_client.check_file_exists(request.object_key):
            raise HTTPException(
                status_code=400,
                detail="File not found in storage. Upload may have failed.",
            )
    except Exception as e:
        logger.error(f"Failed to verify file in R2: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to verify upload: {str(e)}"
        )

    # Create asset record
    asset = Asset(
        id=request.asset_id,  # Use the pre-generated asset ID
        shoot_id=request.shoot_id,
        user_id=user.id,
        original_filename=request.filename,
        file_path=request.object_key,  # Store R2 object key in file_path
        file_size=request.file_size,
        mime_type=request.content_type,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)

    logger.info(f"Asset {asset.id} confirmed and registered")

    return {
        "id": str(asset.id),
        "filename": asset.original_filename,
        "size": asset.file_size,
        "object_key": request.object_key,
    }


@app.get("/shoots")
def list_shoots(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List all shoots for the user with job status aggregation"""

    # Query all shoots for the user with related assets and jobs
    shoots = db.query(Shoot).filter(Shoot.user_id == user.id).all()

    result = []
    for shoot in shoots:
        # Count total assets
        asset_count = len(shoot.assets)

        # Aggregate job statuses across all assets
        job_statuses = {
            "queued": 0,
            "processing": 0,
            "succeeded": 0,
            "failed": 0,
        }

        for asset in shoot.assets:
            for job in asset.jobs:
                job_statuses[job.status.value] += 1

        # Determine overall project status
        if job_statuses["queued"] > 0 or job_statuses["processing"] > 0:
            project_status = "in_progress"
        elif job_statuses["succeeded"] > 0:
            project_status = "completed"
        elif job_statuses["failed"] > 0:
            project_status = "failed"
        else:
            project_status = "draft"  # No jobs yet

        result.append(
            {
                "id": str(shoot.id),
                "name": shoot.name,
                "created_at": shoot.created_at.isoformat(),
                "updated_at": shoot.updated_at.isoformat(),
                "asset_count": asset_count,
                "job_statuses": job_statuses,
                "status": project_status,
            }
        )

    # Sort by updated_at descending (most recent first)
    result.sort(key=lambda x: x["updated_at"], reverse=True)

    return {"shoots": result}


@app.post("/shoots")
def create_shoot(
    name: str = Form(..., min_length=1, max_length=255),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Create a new photo shoot with validated name"""
    # Additional validation for whitespace-only names
    name = name.strip()
    if not name:
        raise HTTPException(
            status_code=422, detail="Name cannot be empty or whitespace"
        )

    shoot = Shoot(user_id=user.id, name=name)
    db.add(shoot)
    db.commit()
    db.refresh(shoot)
    return {"id": str(shoot.id), "name": shoot.name}


@app.post("/uploads")
async def upload_file(
    shoot_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Upload a file to a shoot"""

    print(f"\n=== UPLOAD DEBUG ===")
    print(f"Shoot ID: {shoot_id}")
    print(f"File: {file.filename}")
    print(f"Content type: {file.content_type}")
    print(f"File size attribute: {getattr(file, 'size', 'Not available')}")

    # Validate shoot exists and belongs to user
    shoot = (
        db.query(Shoot).filter(Shoot.id == shoot_id, Shoot.user_id == user.id).first()
    )
    if not shoot:
        raise HTTPException(status_code=404, detail="Shoot not found")

    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOADS_DIR, unique_filename)

    print(f"Saving to: {file_path}")

    # Read the file content
    file_content = await file.read()
    print(f"File content size: {len(file_content)} bytes")

    if len(file_content) == 0:
        print("ERROR: File content is empty!")
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    # Save file
    with open(file_path, "wb") as buffer:
        buffer.write(file_content)

    # Get file size
    file_size = os.path.getsize(file_path)
    print(f"File saved, size on disk: {file_size} bytes")

    # Create asset record
    asset = Asset(
        shoot_id=shoot_id,
        user_id=user.id,
        original_filename=file.filename or "unknown",
        file_path=file_path,
        file_size=file_size,
        mime_type=file.content_type or "image/jpeg",
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)

    print(f"Asset created: {asset.id}")

    return {
        "id": str(asset.id),
        "filename": asset.original_filename,
        "size": asset.file_size,
    }


@app.post("/jobs")
@limiter.limit(RATE_LIMITS["job_create"])
def create_job(
    request: Request,
    asset_id: str = Form(...),
    prompt: str = Form(...),
    tier: str = Form("premium"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Create a new processing job (rate limited: 10/minute)"""

    # Validate asset exists and belongs to user
    asset = (
        db.query(Asset).filter(Asset.id == asset_id, Asset.user_id == user.id).first()
    )
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    # Check user credits
    credit = db.query(Credit).filter(Credit.user_id == user.id).first()
    if not credit or credit.balance < 1:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    # Set credits based on tier
    credits_used = 1 if tier == "free" else 2  # Premium tier costs more

    # Check sufficient balance for the tier
    if credit.balance < credits_used:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    # Deduct credits upfront (reservation) - will be refunded on failure
    credit.balance -= credits_used
    db.flush()

    # Create job in database
    job = Job(
        asset_id=asset_id,
        user_id=user.id,
        prompt=prompt,
        status=JobStatus.queued,
        credits_used=credits_used,
    )
    db.add(job)
    db.flush()  # Get job ID

    # Create job event
    event = JobEvent(
        job_id=job.id,
        event_type="created",
        details=json.dumps(
            {"prompt": prompt, "tier": tier, "credits_used": credits_used}
        ),
    )
    db.add(event)
    db.commit()
    db.refresh(job)

    # Enqueue job for processing
    try:
        from services.worker.job_processor import (
            get_job_priority,
            process_image_enhancement,
        )

        from job_queue import enqueue_job

        priority = get_job_priority(credits_used, tier)
        rq_job = enqueue_job(
            process_image_enhancement,
            str(job.id),
            priority=priority,
            job_id=f"luster_job_{job.id}",
        )

        print(f"Enqueued job {job.id} with RQ job ID: {rq_job.id}")

    except Exception as e:
        # Log error but don't fail the request - job can still be processed by polling worker
        print(f"Failed to enqueue job {job.id}: {e}")
        import sentry_sdk

        sentry_sdk.capture_exception(e)

    return {
        "id": str(job.id),
        "status": job.status.value,
        "asset_id": str(job.asset_id),
        "prompt": job.prompt,
        "credits_used": job.credits_used,
    }


@app.get("/jobs/{job_id}")
def get_job(
    job_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get job status and details"""
    # Validate job_id is a valid UUID
    job_id = validate_path_uuid(job_id, "job_id")

    job = db.query(Job).filter(Job.id == job_id, Job.user_id == user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    result = {
        "id": str(job.id),
        "status": job.status.value,
        "asset_id": str(job.asset_id),
        "prompt": job.prompt,
        "credits_used": job.credits_used,
        "created_at": job.created_at.isoformat(),
        "updated_at": job.updated_at.isoformat(),
    }

    if job.started_at:
        result["started_at"] = job.started_at.isoformat()
    if job.completed_at:
        result["completed_at"] = job.completed_at.isoformat()
    if job.output_path:
        # Generate presigned URL for R2 output or fallback to relative path
        if R2_ENABLED:
            try:
                # Get asset for filename
                asset = db.query(Asset).filter(Asset.id == job.asset_id).first()
                filename = (
                    f"enhanced_{asset.original_filename}" if asset else "enhanced.jpg"
                )

                result["output_url"] = r2_client.generate_presigned_download_url(
                    object_key=job.output_path,
                    expiration=3600,
                    filename=filename,
                )
            except Exception as e:
                logger.error(f"Failed to generate presigned URL for job {job.id}: {e}")
                result["output_url"] = f"/outputs/{os.path.basename(job.output_path)}"
        else:
            result["output_url"] = f"/outputs/{os.path.basename(job.output_path)}"
    if job.error_message:
        result["error_message"] = job.error_message

    return result


@app.post("/jobs/{job_id}/refund")
def refund_job_credits(
    job_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Refund credits for a failed job.

    This endpoint allows users to request a refund for a job that failed.
    Credits are only refunded if:
    - The job exists and belongs to the user
    - The job is in 'failed' status
    - Credits haven't already been refunded
    """
    from credit_service import refund_job

    # Validate job_id is a valid UUID
    job_id = validate_path_uuid(job_id, "job_id")

    # Get job and verify ownership
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Attempt refund
    success, message = refund_job(db, job)

    if not success:
        raise HTTPException(status_code=400, detail=message)

    # Get updated credit balance
    credit = db.query(Credit).filter(Credit.user_id == user.id).first()

    return {
        "success": True,
        "message": message,
        "job_id": str(job.id),
        "credits_refunded": job.credits_used,
        "new_balance": credit.balance if credit else 0,
    }


@app.get("/shoots/{shoot_id}/assets")
def get_shoot_assets(
    shoot_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get all assets in a shoot with presigned download URLs"""
    # Validate shoot_id is a valid UUID
    shoot_id = validate_path_uuid(shoot_id, "shoot_id")

    shoot = (
        db.query(Shoot).filter(Shoot.id == shoot_id, Shoot.user_id == user.id).first()
    )
    if not shoot:
        raise HTTPException(status_code=404, detail="Shoot not found")

    assets = db.query(Asset).filter(Asset.shoot_id == shoot_id).all()

    asset_list = []
    for asset in assets:
        # Generate presigned URL for original file if R2 is enabled
        if R2_ENABLED:
            try:
                upload_url = r2_client.generate_presigned_download_url(
                    object_key=asset.file_path,
                    expiration=3600,
                    filename=asset.original_filename,
                )
            except Exception as e:
                logger.error(
                    f"Failed to generate presigned URL for asset {asset.id}: {e}"
                )
                upload_url = f"/uploads/{os.path.basename(asset.file_path)}"
        else:
            upload_url = f"/uploads/{os.path.basename(asset.file_path)}"

        # Build job list with presigned URLs for outputs
        job_list = []
        for job in asset.jobs:
            job_data = {
                "id": str(job.id),
                "status": job.status.value,
                "prompt": job.prompt,
                "error_message": job.error_message,
                "created_at": job.created_at.isoformat() if job.created_at else None,
                "updated_at": job.updated_at.isoformat() if job.updated_at else None,
                "credits_used": job.credits_used,
            }

            # Generate presigned URL for output if available
            if job.output_path:
                if R2_ENABLED:
                    try:
                        job_data["output_url"] = (
                            r2_client.generate_presigned_download_url(
                                object_key=job.output_path,
                                expiration=3600,
                                filename=f"enhanced_{asset.original_filename}",
                            )
                        )
                    except Exception as e:
                        logger.error(
                            f"Failed to generate presigned URL for job {job.id}: {e}"
                        )
                        job_data["output_url"] = (
                            f"/outputs/{os.path.basename(job.output_path)}"
                        )
                else:
                    job_data["output_url"] = (
                        f"/outputs/{os.path.basename(job.output_path)}"
                    )
            else:
                job_data["output_url"] = None

            job_list.append(job_data)

        asset_list.append(
            {
                "id": str(asset.id),
                "filename": asset.original_filename,
                "size": asset.file_size,
                "upload_url": upload_url,
                "jobs": job_list,
            }
        )

    return {
        "shoot": {"id": str(shoot.id), "name": shoot.name},
        "assets": asset_list,
    }


@app.get("/uploads/{filename}")
def serve_upload(filename: str):
    """Serve uploaded files"""
    file_path = os.path.join(UPLOADS_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)


@app.get("/outputs/{filename}")
def serve_output(filename: str, db: Session = Depends(get_db)):
    """Serve processed output files - generates presigned URL from R2"""
    logger.info(f"===== OUTPUTS REQUEST =====")
    logger.info(f"Requested filename: {filename}")

    # Find the job by looking up the filename (job_id.jpg)
    job_id = filename.replace(".jpg", "").replace(".jpeg", "").replace(".png", "")
    logger.info(f"Extracted job_id: {job_id}")

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        logger.error(f"Job not found: {job_id}")
        raise HTTPException(status_code=404, detail="Job not found")

    if not job.output_path:
        logger.error(f"Job {job_id} has no output_path (status: {job.status})")
        raise HTTPException(status_code=404, detail="Output file not found")

    logger.info(f"Job found: {job_id}")
    logger.info(f"  - Status: {job.status}")
    logger.info(f"  - Output path: {job.output_path}")
    logger.info(f"  - R2_ENABLED: {R2_ENABLED}")
    logger.info(f"  - Path starts with '/': {job.output_path.startswith('/')}")

    # If R2 is enabled and path doesn't start with /, it's an R2 key
    if R2_ENABLED and not job.output_path.startswith("/"):
        logger.info(f"Using R2 path - generating presigned URL")
        try:
            # Generate presigned URL for R2 object (valid for 1 hour)
            logger.info(
                f"Calling generate_presigned_download_url with key: {job.output_path}"
            )
            presigned_url = r2_client.generate_presigned_download_url(
                object_key=job.output_path, expiration=3600
            )
            logger.info(f"✅ Generated presigned URL: {presigned_url[:100]}...")
            logger.info(f"Returning 302 redirect to R2")

            # Redirect to the presigned URL
            from fastapi.responses import RedirectResponse

            return RedirectResponse(url=presigned_url, status_code=302)
        except Exception as e:
            logger.error(f"❌ Failed to generate presigned URL for {job.output_path}")
            logger.error(f"Error type: {type(e).__name__}")
            logger.error(f"Error message: {str(e)}")
            logger.error(f"Error details: {repr(e)}")
            import traceback

            logger.error(f"Traceback: {traceback.format_exc()}")
            raise HTTPException(
                status_code=500, detail=f"Failed to retrieve output file: {str(e)}"
            )
    else:
        # Local filesystem fallback
        logger.info(f"Using local filesystem path")
        file_path = os.path.join(OUTPUTS_DIR, filename)
        logger.info(f"Looking for file at: {file_path}")
        if not os.path.exists(file_path):
            logger.error(f"File not found on disk: {file_path}")
            raise HTTPException(status_code=404, detail="File not found")
        logger.info(f"✅ Serving local file: {file_path}")
        return FileResponse(file_path)


@app.get("/credits")
def get_credits(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get user credit balance"""
    credit = db.query(Credit).filter(Credit.user_id == user.id).first()
    return {"balance": credit.balance if credit else 0}


# Mobile API endpoints
@app.get("/api/mobile/test")
def mobile_test():
    """Test endpoint for mobile connectivity"""
    return {"status": "connected", "message": "Mobile API is working"}


@app.post("/api/mobile/enhance")
@limiter.limit(RATE_LIMITS["job_create"])
async def mobile_enhance(
    request: Request,
    image: UploadFile = File(...),
    style: str = Form("luster"),
    shoot_id: Optional[str] = Form(None),
    project_name: Optional[str] = Form(None),
    credit_cost: int = Form(1),  # Credit cost per photo (flexible pricing)
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Mobile endpoint to start image enhancement (rate limited: 10/minute)"""

    print(f"\n=== MOBILE ENHANCE DEBUG ===")
    print(f"Style: {style}")
    print(f"File: {image.filename}")
    print(f"Content type: {image.content_type}")
    print(f"User: {user.id}")
    print(f"Shoot ID: {shoot_id}")
    print(f"Project name: {project_name}")
    print(f"Credit cost: {credit_cost}")

    # Handle shoot: use existing, or create new unique project
    mobile_shoot = None

    if shoot_id:
        # Adding to existing project
        mobile_shoot = (
            db.query(Shoot)
            .filter(Shoot.id == shoot_id, Shoot.user_id == user.id)
            .first()
        )
        if not mobile_shoot:
            raise HTTPException(status_code=404, detail="Project not found")
        print(f"Adding to existing project: {mobile_shoot.name} ({mobile_shoot.id})")
    else:
        # Create new unique project (NOT shared "Mobile Uploads")
        name = project_name
        if not name:
            # Auto-generate name: "Project Dec 11"
            name = f"Project {datetime.now().strftime('%b %d')}"

        # Check for duplicate names and add suffix if needed
        existing_count = (
            db.query(Shoot)
            .filter(Shoot.user_id == user.id, Shoot.name.like(f"{name}%"))
            .count()
        )

        if existing_count > 0:
            name = f"{name} ({existing_count + 1})"

        mobile_shoot = Shoot(id=str(uuid.uuid4()), user_id=user.id, name=name)
        db.add(mobile_shoot)
        db.flush()
        print(f"Created new project: {mobile_shoot.name} ({mobile_shoot.id})")

    # Save uploaded file
    file_content = await image.read()
    print(f"File content size: {len(file_content)} bytes")

    if len(file_content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    # Generate unique filename with mobile prefix
    file_ext = os.path.splitext(image.filename)[1] if image.filename else ".jpg"
    unique_filename = f"mobile_{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOADS_DIR, unique_filename)

    # Save file temporarily
    with open(file_path, "wb") as buffer:
        buffer.write(file_content)

    print(f"File saved temporarily: {file_path}")

    # Check if file needs conversion (HEIC or other formats)
    # Check both file extension and content-type header
    is_heic = (
        file_ext.lower() in [".heic", ".heif"]
        or not file_ext
        or (image.content_type and "heic" in image.content_type.lower())
        or (image.content_type and "heif" in image.content_type.lower())
    )

    if is_heic:
        # Always save as .jpg for processing
        jpg_filename = f"mobile_{uuid.uuid4()}.jpg"
        jpg_path = os.path.join(UPLOADS_DIR, jpg_filename)

        print(
            f"Converting HEIC/HEIF (content-type: {image.content_type}, ext: {file_ext}) to JPG..."
        )
        convert_to_jpg(file_path, jpg_path)

        # Remove original HEIC file
        os.remove(file_path)
        file_path = jpg_path
        print(f"Converted to JPG: {jpg_path}")

    file_size = os.path.getsize(file_path)
    print(f"Final file: {file_path}, size: {file_size} bytes")

    # Upload to R2 so worker can access it (API and Worker run in separate containers)
    if R2_ENABLED:
        asset_id = str(uuid.uuid4())
        r2_key = f"{user.id}/{mobile_shoot.id}/{asset_id}/original.jpg"
        print(f"Uploading to R2: {r2_key}")
        r2_client.upload_file(
            file_path=file_path, object_key=r2_key, content_type="image/jpeg"
        )
        # Clean up local file after R2 upload
        os.remove(file_path)
        storage_path = r2_key  # Store R2 key, not local path
        print(f"Uploaded to R2: {r2_key}")
    else:
        asset_id = str(uuid.uuid4())
        storage_path = file_path  # Local path for development
        print(f"R2 not enabled, using local path: {file_path}")

    # Create asset
    asset = Asset(
        id=asset_id,
        shoot_id=mobile_shoot.id,
        user_id=user.id,
        original_filename=image.filename or "photo.jpg",
        file_path=storage_path,
        file_size=file_size,
        mime_type="image/jpeg",  # Always JPG after conversion
    )
    db.add(asset)
    db.flush()

    # Check or create credits with row-level lock to prevent race conditions
    # Using FOR UPDATE ensures atomic read-check-modify operation
    credit = (
        db.query(Credit)
        .filter(Credit.user_id == user.id)
        .with_for_update()  # Lock the row to prevent concurrent modifications
        .first()
    )
    if not credit:
        credit = Credit(user_id=user.id, balance=0)
        db.add(credit)
        db.flush()
        # Re-query with lock after creation
        credit = (
            db.query(Credit)
            .filter(Credit.user_id == user.id)
            .with_for_update()
            .first()
        )

    if credit.balance < credit_cost:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    # Deduct credits upfront (reservation) - will be refunded on failure
    credit.balance -= credit_cost
    db.flush()

    # Create job with proper prompt
    style_prompts = {
        "luster": "Luster AI signature style - luxury editorial real estate photography with dramatic lighting",
        "flambient": "Bright, airy interior with crisp whites and flambient lighting technique",
    }

    job = Job(
        asset_id=asset.id,
        user_id=user.id,
        prompt=style_prompts.get(style, style_prompts["luster"]),
        status=JobStatus.queued,
        credits_used=credit_cost,
    )
    db.add(job)
    db.flush()

    # Create job event
    event = JobEvent(
        job_id=job.id,
        event_type="created",
        details=json.dumps({"source": "mobile", "style": style}),
    )
    db.add(event)
    db.commit()

    print(f"Job created: {job.id}")

    return {
        "job_id": str(job.id),
        "shoot_id": str(mobile_shoot.id),  # Include shoot_id for batch grouping
        "status": "queued",
        "message": "Enhancement job created successfully",
    }


@app.post("/api/mobile/enhance-base64")
@limiter.limit(RATE_LIMITS["job_create"])
async def mobile_enhance_base64(
    request: Request,
    body: Base64ImageRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Mobile endpoint to enhance image from base64 data (rate limited: 10/minute)"""

    print(f"\n=== MOBILE ENHANCE BASE64 DEBUG ===")
    print(f"Style: {body.style}")
    print(f"Image data length: {len(body.image)} chars")
    print(f"User: {user.id}")

    # Decode base64 image
    try:
        image_data = base64.b64decode(body.image)
        print(f"Decoded image size: {len(image_data)} bytes")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 image: {str(e)}")

    # Handle shoot: use existing, or create new project
    mobile_shoot = None

    if body.shoot_id:
        # Adding to existing project
        mobile_shoot = (
            db.query(Shoot)
            .filter(Shoot.id == body.shoot_id, Shoot.user_id == user.id)
            .first()
        )
        if not mobile_shoot:
            raise HTTPException(status_code=404, detail="Project not found")
        print(f"Adding to existing project: {mobile_shoot.name} ({mobile_shoot.id})")
    else:
        # Create new project
        project_name = body.project_name
        if not project_name:
            # Auto-generate name: "Project Dec 11"
            project_name = f"Project {datetime.now().strftime('%b %d')}"

        # Check for duplicate names and add suffix if needed
        existing_count = (
            db.query(Shoot)
            .filter(Shoot.user_id == user.id, Shoot.name.like(f"{project_name}%"))
            .count()
        )

        if existing_count > 0:
            project_name = f"{project_name} ({existing_count + 1})"

        mobile_shoot = Shoot(id=str(uuid.uuid4()), user_id=user.id, name=project_name)
        db.add(mobile_shoot)
        db.flush()
        print(f"Created new project: {mobile_shoot.name} ({mobile_shoot.id})")

    # Save image data temporarily
    temp_filename = f"mobile_{uuid.uuid4()}_temp"
    temp_path = os.path.join(UPLOADS_DIR, temp_filename)

    with open(temp_path, "wb") as f:
        f.write(image_data)

    # Convert to JPG (handles HEIC and other formats)
    final_filename = f"mobile_{uuid.uuid4()}.jpg"
    file_path = os.path.join(UPLOADS_DIR, final_filename)

    try:
        convert_to_jpg(temp_path, file_path)
        os.remove(temp_path)  # Remove temporary file
    except Exception as e:
        # If conversion fails, just use the original file
        print(f"Conversion failed, using original: {e}")
        os.rename(temp_path, file_path)

    file_size = os.path.getsize(file_path)
    print(f"File converted: {file_path}, size: {file_size} bytes")

    # Upload to R2 so worker can access it (API and Worker run in separate containers)
    if R2_ENABLED:
        asset_id = str(uuid.uuid4())
        r2_key = f"{user.id}/{mobile_shoot.id}/{asset_id}/original.jpg"
        print(f"Uploading to R2: {r2_key}")
        r2_client.upload_file(
            file_path=file_path, object_key=r2_key, content_type="image/jpeg"
        )
        # Clean up local file after R2 upload
        os.remove(file_path)
        storage_path = r2_key  # Store R2 key, not local path
        print(f"Uploaded to R2: {r2_key}")
    else:
        asset_id = str(uuid.uuid4())
        storage_path = file_path  # Local path for development
        print(f"R2 not enabled, using local path: {file_path}")

    # Create asset
    asset = Asset(
        id=asset_id,
        shoot_id=mobile_shoot.id,
        user_id=user.id,
        original_filename="photo.jpg",
        file_path=storage_path,
        file_size=file_size,
        mime_type="image/jpeg",
    )
    db.add(asset)
    db.flush()

    # Check or create credits with row-level lock to prevent race conditions
    # Using FOR UPDATE ensures atomic read-check-modify operation
    credit = (
        db.query(Credit)
        .filter(Credit.user_id == user.id)
        .with_for_update()  # Lock the row to prevent concurrent modifications
        .first()
    )
    if not credit:
        credit = Credit(user_id=user.id, balance=0)
        db.add(credit)
        db.flush()
        # Re-query with lock after creation
        credit = (
            db.query(Credit)
            .filter(Credit.user_id == user.id)
            .with_for_update()
            .first()
        )

    if credit.balance < body.credit_cost:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    # Deduct credits upfront (reservation) - will be refunded on failure
    credit.balance -= body.credit_cost
    db.flush()

    # Create job
    style_prompts = {
        "luster": "Luster AI signature style - luxury editorial real estate photography with dramatic lighting",
        "flambient": "Bright, airy interior with crisp whites and flambient lighting technique",
    }

    job = Job(
        asset_id=asset.id,
        user_id=user.id,
        prompt=style_prompts.get(body.style, style_prompts["luster"]),
        status=JobStatus.queued,
        credits_used=body.credit_cost,
    )
    db.add(job)
    db.flush()

    # Create job event
    event = JobEvent(
        job_id=job.id,
        event_type="created",
        details=json.dumps(
            {"source": "mobile_base64", "style": body.style, "credits_reserved": body.credit_cost}
        ),
    )
    db.add(event)
    db.commit()

    print(f"Job created: {job.id}")

    return {
        "job_id": str(job.id),
        "shoot_id": str(mobile_shoot.id),
        "asset_id": str(asset.id),
        "project_name": mobile_shoot.name,
        "status": "queued",
        "message": "Enhancement job created successfully",
    }


@app.get("/api/mobile/enhance/{job_id}/status")
def mobile_job_status(
    job_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get status of mobile enhancement job (requires authentication)"""

    # Find job and verify ownership
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == user.id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found or access denied")

    result = {
        "job_id": str(job.id),
        "status": job.status.value,
        "created_at": job.created_at.isoformat(),
        "updated_at": job.updated_at.isoformat(),
    }

    if job.started_at:
        result["started_at"] = job.started_at.isoformat()

    if job.completed_at:
        result["completed_at"] = job.completed_at.isoformat()

    if job.status == JobStatus.succeeded and job.output_path:
        # Return the output URL for mobile to fetch
        result["enhanced_image_url"] = f"/outputs/{os.path.basename(job.output_path)}"

    if job.status == JobStatus.failed and job.error_message:
        result["error"] = job.error_message

    return result


@app.get("/api/mobile/credits")
def mobile_get_credits(
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    """Get user credit balance for mobile"""
    # Use authenticated user or fall back to default for development
    if not user:
        logger.warning(
            "Mobile credits called without authentication, using DEFAULT_USER_ID"
        )
        user = db.query(User).filter(User.id == DEFAULT_USER_ID).first()
        if not user:
            user = User(id=DEFAULT_USER_ID, email="mobile@luster.ai")
            db.add(user)
            db.flush()

    # Get or create credits
    credit = db.query(Credit).filter(Credit.user_id == user.id).first()
    if not credit:
        credit = Credit(user_id=user.id, balance=0)
        db.add(credit)
        db.commit()

    return {
        "balance": credit.balance,
        "user_id": str(user.id),
        "updated_at": (
            credit.updated_at.isoformat()
            if hasattr(credit, "updated_at") and credit.updated_at
            else None
        ),
    }


@app.get("/api/mobile/styles")
def mobile_get_styles():
    """Get available enhancement styles for mobile"""
    return {
        "styles": [
            {
                "id": "luster",
                "name": "Luster",
                "description": "Luster AI signature style - luxury editorial real estate photography",
            },
            {
                "id": "flambient",
                "name": "Flambient",
                "description": "Bright, airy interior with crisp whites and flambient lighting",
            },
        ]
    }


@app.get("/api/mobile/listings")
def mobile_get_listings(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get user's completed property listings for mobile app"""
    logger.info(f"Fetching listings for user: {user.id}")

    # Get all shoots for this user with completed jobs
    shoots = db.query(Shoot).filter(Shoot.user_id == user.id).all()

    listings = []

    for shoot in shoots:
        # Get all succeeded jobs for this shoot with their assets
        jobs = (
            db.query(Job)
            .join(Asset)
            .filter(
                Asset.shoot_id == shoot.id,
                Job.status == JobStatus.succeeded,
                Job.output_path.isnot(None),
            )
            .order_by(Job.completed_at.desc())
            .all()
        )

        if not jobs:
            continue  # Skip shoots with no completed jobs

        # Get the first asset for metadata
        first_asset = db.query(Asset).filter(Asset.shoot_id == shoot.id).first()
        if not first_asset:
            continue

        # Build enhanced image URLs with presigned R2 URLs
        enhanced_images = []
        for job in jobs:
            image_url = None
            if R2_ENABLED and job.output_path and not job.output_path.startswith("/"):
                try:
                    # Get asset for filename
                    asset = db.query(Asset).filter(Asset.id == job.asset_id).first()
                    filename = (
                        f"enhanced_{asset.original_filename}"
                        if asset
                        else "enhanced.jpg"
                    )
                    image_url = r2_client.generate_presigned_download_url(
                        object_key=job.output_path,
                        expiration=3600,
                        filename=filename,
                    )
                except Exception as e:
                    logger.error(
                        f"Failed to generate presigned URL for job {job.id}: {e}"
                    )
                    image_url = f"/outputs/{os.path.basename(job.output_path)}"
            else:
                image_url = f"/outputs/{os.path.basename(job.output_path)}"

            if image_url:
                enhanced_images.append({"uri": image_url})

        # Use shoot name, but provide better fallback for "Mobile Uploads"
        address = shoot.name
        if not address or address == "Mobile Uploads":
            # Use first asset filename as address, cleaned up
            address = (
                first_asset.original_filename.replace(".jpg", "")
                .replace(".heic", "")
                .replace(".jpeg", "")
                .replace("_", " ")
                .title()
            )

        # Create listing object
        listing = {
            "id": shoot.id,
            "address": address,
            "price": "",  # Not stored in DB yet
            "beds": 0,  # Not stored in DB yet
            "baths": 0,  # Not stored in DB yet
            "image": {"uri": enhanced_images[0]["uri"]} if enhanced_images else None,
            "images": enhanced_images,
            "originalImages": [],  # Originals are deleted after processing
            "isEnhanced": True,
            "status": "completed",
            "createdAt": shoot.created_at.isoformat(),
        }

        listings.append(listing)

    logger.info(f"Found {len(listings)} listings for user {user.id}")

    return {"listings": listings, "count": len(listings)}


@app.delete("/api/mobile/projects/{shoot_id}")
def delete_project(
    shoot_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Delete a project (shoot) and all its assets/jobs from database and R2"""
    logger.info(f"Deleting project {shoot_id} for user {user.id}")

    # Find the shoot and verify ownership
    shoot = (
        db.query(Shoot).filter(Shoot.id == shoot_id, Shoot.user_id == user.id).first()
    )

    if not shoot:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get all assets for this shoot
    assets = db.query(Asset).filter(Asset.shoot_id == shoot_id).all()

    # Delete R2 files for each asset
    deleted_files = []
    for asset in assets:
        # Delete original file from R2
        if R2_ENABLED and asset.file_path and not asset.file_path.startswith("/"):
            try:
                r2_client.delete_file(asset.file_path)
                deleted_files.append(asset.file_path)
                logger.info(f"Deleted R2 file: {asset.file_path}")
            except Exception as e:
                logger.error(f"Failed to delete R2 file {asset.file_path}: {e}")

        # Delete output files from jobs
        jobs = db.query(Job).filter(Job.asset_id == asset.id).all()
        for job in jobs:
            if R2_ENABLED and job.output_path and not job.output_path.startswith("/"):
                try:
                    r2_client.delete_file(job.output_path)
                    deleted_files.append(job.output_path)
                    logger.info(f"Deleted R2 output: {job.output_path}")
                except Exception as e:
                    logger.error(f"Failed to delete R2 output {job.output_path}: {e}")

            # Delete job events
            db.query(JobEvent).filter(JobEvent.job_id == job.id).delete()

        # Delete jobs for this asset
        db.query(Job).filter(Job.asset_id == asset.id).delete()

    # Delete all assets for this shoot
    db.query(Asset).filter(Asset.shoot_id == shoot_id).delete()

    # Delete the shoot itself
    db.delete(shoot)
    db.commit()

    logger.info(
        f"Deleted project {shoot_id}: {len(assets)} assets, {len(deleted_files)} R2 files"
    )

    return {
        "success": True,
        "deleted_shoot_id": shoot_id,
        "deleted_assets": len(assets),
        "deleted_r2_files": len(deleted_files),
    }


# ============================================================================
# Mobile Integration Endpoints
# ============================================================================


@app.post("/api/mobile/users/sync")
def sync_user(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Sync authenticated Supabase user to backend database.
    Called after social login to ensure user exists in our DB.
    Returns user info and credit balance.
    """
    # Get or create credits for user
    credit = db.query(Credit).filter(Credit.user_id == user.id).first()
    is_new = credit is None

    if not credit:
        # New users start with 0 credits - must purchase
        credit = Credit(user_id=user.id, balance=0)
        db.add(credit)
        db.commit()
        db.refresh(credit)

    return {
        "user_id": str(user.id),
        "email": user.email,
        "created": is_new,
        "credits": {"balance": credit.balance, "is_new_user": is_new},
    }


@app.get("/api/mobile/credits/balance")
def mobile_get_credits_balance(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get user credit balance for mobile (requires auth)"""

    credit = db.query(Credit).filter(Credit.user_id == user.id).first()

    if not credit:
        # New users start with 0 credits - must purchase
        credit = Credit(user_id=user.id, balance=0)
        db.add(credit)
        db.commit()
        db.refresh(credit)

    return {
        "balance": credit.balance,
        "user_id": str(user.id),
        "updated_at": credit.updated_at.isoformat() if credit.updated_at else None,
    }


class MobilePresignRequest(BaseModel):
    filename: str
    content_type: str = "image/jpeg"
    file_size: int = 10 * 1024 * 1024


@app.post("/api/mobile/uploads/presign")
def mobile_presign_upload(
    request: MobilePresignRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Generate presigned upload URL for mobile direct-to-R2 uploads"""

    if not R2_ENABLED:
        raise HTTPException(status_code=503, detail="R2 storage not configured")

    # Get or create "Mobile Uploads" shoot for this user
    mobile_shoot = (
        db.query(Shoot)
        .filter(Shoot.user_id == user.id, Shoot.name == "Mobile Uploads")
        .first()
    )

    if not mobile_shoot:
        mobile_shoot = Shoot(user_id=user.id, name="Mobile Uploads")
        db.add(mobile_shoot)
        db.flush()

    # Generate asset ID and object key
    asset_id = str(uuid.uuid4())
    file_ext = os.path.splitext(request.filename)[1] or ".jpg"
    object_key = f"{user.id}/{mobile_shoot.id}/{asset_id}/original{file_ext}"

    try:
        presigned_data = r2_client.generate_presigned_upload_url(
            object_key=object_key,
            content_type=request.content_type,
            expiration=3600,
            max_file_size=request.file_size,
        )

        return {
            "asset_id": asset_id,
            "shoot_id": str(mobile_shoot.id),
            "object_key": object_key,
            "upload_url": presigned_data["url"],
            "upload_fields": presigned_data["fields"],
            "expires_in": 3600,
        }

    except Exception as e:
        logger.error(f"Failed to generate mobile presigned URL: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class MobileConfirmRequest(BaseModel):
    asset_id: str
    shoot_id: str
    object_key: str
    filename: str
    file_size: int
    content_type: str = "image/jpeg"


@app.post("/api/mobile/uploads/confirm")
def mobile_confirm_upload(
    request: MobileConfirmRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Confirm upload completion and create asset record"""

    # Verify shoot belongs to user
    shoot = (
        db.query(Shoot)
        .filter(Shoot.id == request.shoot_id, Shoot.user_id == user.id)
        .first()
    )

    if not shoot:
        raise HTTPException(status_code=404, detail="Shoot not found")

    # Optionally verify file exists in R2
    if R2_ENABLED:
        try:
            if not r2_client.check_file_exists(request.object_key):
                raise HTTPException(status_code=400, detail="File not found in storage")
        except Exception as e:
            logger.warning(f"Could not verify file existence: {e}")

    # Create asset record
    asset = Asset(
        id=request.asset_id,
        shoot_id=request.shoot_id,
        user_id=user.id,
        original_filename=request.filename,
        file_path=request.object_key,
        file_size=request.file_size,
        mime_type=request.content_type,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)

    # Generate download URL
    upload_url = None
    if R2_ENABLED:
        try:
            upload_url = r2_client.generate_presigned_download_url(
                object_key=request.object_key,
                expiration=3600,
                filename=request.filename,
            )
        except Exception as e:
            logger.error(f"Failed to generate download URL: {e}")

    return {
        "id": str(asset.id),
        "filename": asset.original_filename,
        "size": asset.file_size,
        "upload_url": upload_url,
    }


@app.get("/api/mobile/gallery")
def get_gallery(
    page: int = 1,
    per_page: int = 50,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get all user photos with signed URLs for mobile gallery view"""

    # Count total assets
    total = db.query(Asset).filter(Asset.user_id == user.id).count()

    # Get paginated assets with shoots and jobs
    assets = (
        db.query(Asset)
        .filter(Asset.user_id == user.id)
        .order_by(Asset.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    photos = []
    for asset in assets:
        # Generate presigned URL for original
        upload_url = None
        if R2_ENABLED:
            try:
                upload_url = r2_client.generate_presigned_download_url(
                    object_key=asset.file_path,
                    expiration=3600,
                    filename=asset.original_filename,
                )
            except Exception as e:
                logger.error(f"Failed to generate URL for asset {asset.id}: {e}")

        # Build job list with output URLs
        job_list = []
        for job in asset.jobs:
            job_data = {
                "id": str(job.id),
                "status": job.status.value,
                "prompt": job.prompt,
                "credits_used": job.credits_used,
                "created_at": job.created_at.isoformat(),
                "output_url": None,
            }

            if job.output_path and R2_ENABLED:
                try:
                    job_data["output_url"] = r2_client.generate_presigned_download_url(
                        object_key=job.output_path,
                        expiration=3600,
                        filename=f"enhanced_{asset.original_filename}",
                    )
                except Exception as e:
                    logger.error(f"Failed to generate URL for job {job.id}: {e}")

            job_list.append(job_data)

        photos.append(
            {
                "id": str(asset.id),
                "filename": asset.original_filename,
                "upload_url": upload_url,
                "thumbnail_url": None,  # Future: generate thumbnails
                "shoot": {
                    "id": str(asset.shoot_id),
                    "name": asset.shoot.name,
                },
                "created_at": asset.created_at.isoformat(),
                "jobs": job_list,
            }
        )

    return {
        "photos": photos,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total + per_page - 1) // per_page if total > 0 else 0,
        },
    }


# ============================================================================
# RQ Dashboard Integration (Optional)
# ============================================================================

# Try to mount RQ Dashboard if Redis is available
try:
    import redis

    redis_url = os.getenv("REDIS_URL")
    if redis_url:
        # Test Redis connection
        redis_conn = redis.from_url(redis_url)
        redis_conn.ping()

        # Try to import and mount RQ Dashboard Fast
        try:
            from rq_dashboard_fast import RedisQueueDashboard

            dashboard = RedisQueueDashboard(redis_url)
            app.mount("/admin/rq", dashboard)
            logger.info("RQ Dashboard mounted at /admin/rq")
        except ImportError:
            logger.warning(
                "rq-dashboard-fast not installed. Install with: pip install rq-dashboard-fast"
            )
    else:
        logger.info("REDIS_URL not set, skipping RQ Dashboard")
except Exception as e:
    logger.warning(f"Could not initialize RQ Dashboard: {e}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
