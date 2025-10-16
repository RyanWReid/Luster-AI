import json
import os
import shutil
import time
import uuid
import base64
from datetime import datetime
from pathlib import Path
from typing import Optional

import sentry_sdk
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import (Asset, Credit, Job, JobEvent, JobStatus, Shoot, User,
                      get_db)
from logger import (LoggingMiddleware, log_credit_transaction,
                    log_health_check, log_job_created, log_upload_completed,
                    log_upload_started, logger)
from admin import router as admin_router

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
    logger.info(f"Sentry initialized with {os.getenv('SENTRY_TRACES_SAMPLE_RATE', '0.25')} trace sampling")
else:
    logger.warning("SENTRY_DSN not set, Sentry not initialized")

app = FastAPI(title="Luster AI API", version="1.0.0")

# Include admin monitoring router
app.include_router(admin_router)

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

UPLOADS_DIR = os.getenv("UPLOADS_DIR", "../../uploads")
OUTPUTS_DIR = os.getenv("OUTPUTS_DIR", "../../outputs")

# Ensure directories exist
Path(UPLOADS_DIR).mkdir(parents=True, exist_ok=True)
Path(OUTPUTS_DIR).mkdir(parents=True, exist_ok=True)

# Default user ID for local development (matches schema.sql)
# Using string format since UUIDType is now String(36) for SQLite compatibility
DEFAULT_USER_ID = "550e8400-e29b-41d4-a716-446655440000"

# Pydantic models for mobile API
class Base64ImageRequest(BaseModel):
    image: str  # Base64 encoded image
    style: str = "luster"


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

    return health_status


@app.post("/shoots")
def create_shoot(name: str = Form(...), db: Session = Depends(get_db)):
    """Create a new photo shoot"""
    shoot = Shoot(user_id=DEFAULT_USER_ID, name=name)
    db.add(shoot)
    db.commit()
    db.refresh(shoot)
    return {"id": str(shoot.id), "name": shoot.name}


@app.post("/uploads")
async def upload_file(
    shoot_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Upload a file to a shoot"""

    print(f"\n=== UPLOAD DEBUG ===")
    print(f"Shoot ID: {shoot_id}")
    print(f"File: {file.filename}")
    print(f"Content type: {file.content_type}")
    print(f"File size attribute: {getattr(file, 'size', 'Not available')}")

    # Validate shoot exists
    shoot = db.query(Shoot).filter(Shoot.id == shoot_id).first()
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
        user_id=DEFAULT_USER_ID,
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
def create_job(
    asset_id: str = Form(...),
    prompt: str = Form(...),
    tier: str = Form("premium"),
    db: Session = Depends(get_db),
):
    """Create a new processing job"""

    # Validate asset exists
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    # Check user credits
    credit = db.query(Credit).filter(Credit.user_id == DEFAULT_USER_ID).first()
    if not credit or credit.balance < 1:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    # Set credits based on tier
    credits_used = 1 if tier == "free" else 2  # Premium tier costs more

    # Check sufficient balance for the tier
    if credit.balance < credits_used:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    # Create job in database
    job = Job(
        asset_id=asset_id,
        user_id=DEFAULT_USER_ID,
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
        from job_queue import enqueue_job

        from services.worker.job_processor import (get_job_priority,
                                                   process_image_enhancement)

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
def get_job(job_id: str, db: Session = Depends(get_db)):
    """Get job status and details"""

    job = db.query(Job).filter(Job.id == job_id).first()
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
        result["output_url"] = f"/outputs/{os.path.basename(job.output_path)}"
    if job.error_message:
        result["error_message"] = job.error_message

    return result


@app.get("/shoots/{shoot_id}/assets")
def get_shoot_assets(shoot_id: str, db: Session = Depends(get_db)):
    """Get all assets in a shoot"""

    shoot = db.query(Shoot).filter(Shoot.id == shoot_id).first()
    if not shoot:
        raise HTTPException(status_code=404, detail="Shoot not found")

    assets = db.query(Asset).filter(Asset.shoot_id == shoot_id).all()

    return {
        "shoot": {"id": str(shoot.id), "name": shoot.name},
        "assets": [
            {
                "id": str(asset.id),
                "filename": asset.original_filename,
                "size": asset.file_size,
                "upload_url": f"/uploads/{os.path.basename(asset.file_path)}",
                "jobs": [
                    {
                        "id": str(job.id),
                        "status": job.status.value,
                        "prompt": job.prompt,
                        "output_url": (
                            f"/outputs/{os.path.basename(job.output_path)}"
                            if job.output_path
                            else None
                        ),
                        "error_message": job.error_message,
                        "created_at": (
                            job.created_at.isoformat() if job.created_at else None
                        ),
                        "updated_at": (
                            job.updated_at.isoformat() if job.updated_at else None
                        ),
                        "credits_used": job.credits_used,
                    }
                    for job in asset.jobs
                ],
            }
            for asset in assets
        ],
    }


@app.get("/uploads/{filename}")
def serve_upload(filename: str):
    """Serve uploaded files"""
    file_path = os.path.join(UPLOADS_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)


@app.get("/outputs/{filename}")
def serve_output(filename: str):
    """Serve processed output files"""
    file_path = os.path.join(OUTPUTS_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)


@app.get("/credits")
def get_credits(db: Session = Depends(get_db)):
    """Get user credit balance"""
    credit = db.query(Credit).filter(Credit.user_id == DEFAULT_USER_ID).first()
    return {"balance": credit.balance if credit else 0}


# Mobile API endpoints
@app.get("/api/mobile/test")
def mobile_test():
    """Test endpoint for mobile connectivity"""
    return {"status": "connected", "message": "Mobile API is working"}


@app.post("/api/mobile/enhance")
async def mobile_enhance(
    image: UploadFile = File(...),
    style: str = Form("luster"),
    db: Session = Depends(get_db),
):
    """Mobile endpoint to start image enhancement"""
    
    print(f"\n=== MOBILE ENHANCE DEBUG ===")
    print(f"Style: {style}")
    print(f"File: {image.filename}")
    print(f"Content type: {image.content_type}")
    
    # Get or create mobile shoot
    user = db.query(User).filter(User.id == DEFAULT_USER_ID).first()
    if not user:
        # Create default user if not exists
        user = User(id=DEFAULT_USER_ID, email="mobile@luster.ai")
        db.add(user)
        db.commit()
    
    mobile_shoot = db.query(Shoot).filter(
        Shoot.user_id == user.id,
        Shoot.name == "Mobile Uploads"
    ).first()
    
    if not mobile_shoot:
        mobile_shoot = Shoot(
            id=str(uuid.uuid4()),
            user_id=user.id,
            name="Mobile Uploads"
        )
        db.add(mobile_shoot)
        db.flush()
    
    # Save uploaded file
    file_content = await image.read()
    print(f"File content size: {len(file_content)} bytes")
    
    if len(file_content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    
    # Generate unique filename with mobile prefix
    file_ext = os.path.splitext(image.filename)[1] if image.filename else ".jpg"
    unique_filename = f"mobile_{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOADS_DIR, unique_filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        buffer.write(file_content)
    
    file_size = os.path.getsize(file_path)
    print(f"File saved: {file_path}, size: {file_size} bytes")
    
    # Create asset
    asset = Asset(
        shoot_id=mobile_shoot.id,
        user_id=user.id,
        original_filename=image.filename or "photo.jpg",
        file_path=file_path,
        file_size=file_size,
        mime_type=image.content_type or "image/jpeg",
    )
    db.add(asset)
    db.flush()
    
    # Check or create credits
    credit = db.query(Credit).filter(Credit.user_id == user.id).first()
    if not credit:
        credit = Credit(user_id=user.id, balance=10)  # Give 10 free credits
        db.add(credit)
        db.flush()
    
    if credit.balance < 1:
        raise HTTPException(status_code=402, detail="Insufficient credits")
    
    # Create job with proper prompt
    style_prompts = {
        "luster": "Luster AI signature style - luxury editorial real estate photography with dramatic lighting",
        "flambient": "Bright, airy interior with crisp whites and flambient lighting technique"
    }
    
    job = Job(
        asset_id=asset.id,
        user_id=user.id,
        prompt=style_prompts.get(style, style_prompts["luster"]),
        status=JobStatus.queued,
        credits_used=1,
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
        "status": "queued",
        "message": "Enhancement job created successfully"
    }


@app.post("/api/mobile/enhance-base64")
async def mobile_enhance_base64(
    request: Base64ImageRequest,
    db: Session = Depends(get_db),
):
    """Mobile endpoint to enhance image from base64 data"""
    
    print(f"\n=== MOBILE ENHANCE BASE64 DEBUG ===")
    print(f"Style: {request.style}")
    print(f"Image data length: {len(request.image)} chars")
    
    # Decode base64 image
    try:
        image_data = base64.b64decode(request.image)
        print(f"Decoded image size: {len(image_data)} bytes")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 image: {str(e)}")
    
    # Get or create mobile shoot
    user = db.query(User).filter(User.id == DEFAULT_USER_ID).first()
    if not user:
        user = User(id=DEFAULT_USER_ID, email="mobile@luster.ai")
        db.add(user)
        db.commit()
    
    mobile_shoot = db.query(Shoot).filter(
        Shoot.user_id == user.id,
        Shoot.name == "Mobile Uploads"
    ).first()
    
    if not mobile_shoot:
        mobile_shoot = Shoot(
            id=str(uuid.uuid4()),
            user_id=user.id,
            name="Mobile Uploads"
        )
        db.add(mobile_shoot)
        db.flush()
    
    # Save image data
    unique_filename = f"mobile_{uuid.uuid4()}.jpg"
    file_path = os.path.join(UPLOADS_DIR, unique_filename)
    
    with open(file_path, "wb") as f:
        f.write(image_data)
    
    file_size = len(image_data)
    print(f"File saved: {file_path}, size: {file_size} bytes")
    
    # Create asset
    asset = Asset(
        shoot_id=mobile_shoot.id,
        user_id=user.id,
        original_filename="photo.jpg",
        file_path=file_path,
        file_size=file_size,
        mime_type="image/jpeg",
    )
    db.add(asset)
    db.flush()
    
    # Check or create credits
    credit = db.query(Credit).filter(Credit.user_id == user.id).first()
    if not credit:
        credit = Credit(user_id=user.id, balance=10)
        db.add(credit)
        db.flush()
    
    if credit.balance < 1:
        raise HTTPException(status_code=402, detail="Insufficient credits")
    
    # Create job
    style_prompts = {
        "luster": "Luster AI signature style - luxury editorial real estate photography with dramatic lighting",
        "flambient": "Bright, airy interior with crisp whites and flambient lighting technique"
    }
    
    job = Job(
        asset_id=asset.id,
        user_id=user.id,
        prompt=style_prompts.get(request.style, style_prompts["luster"]),
        status=JobStatus.queued,
        credits_used=1,
    )
    db.add(job)
    db.flush()
    
    # Create job event
    event = JobEvent(
        job_id=job.id,
        event_type="created",
        details=json.dumps({"source": "mobile_base64", "style": request.style}),
    )
    db.add(event)
    db.commit()
    
    print(f"Job created: {job.id}")
    
    return {
        "job_id": str(job.id),
        "status": "queued",
        "message": "Enhancement job created successfully"
    }


@app.get("/api/mobile/enhance/{job_id}/status")
def mobile_job_status(job_id: str, db: Session = Depends(get_db)):
    """Get status of mobile enhancement job"""
    
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
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
def mobile_get_credits(db: Session = Depends(get_db)):
    """Get user credit balance for mobile"""
    # Get or create user
    user = db.query(User).filter(User.id == DEFAULT_USER_ID).first()
    if not user:
        user = User(id=DEFAULT_USER_ID, email="mobile@luster.ai")
        db.add(user)
        db.flush()

    # Get or create credits
    credit = db.query(Credit).filter(Credit.user_id == user.id).first()
    if not credit:
        credit = Credit(user_id=user.id, balance=10)
        db.add(credit)
        db.commit()

    return {
        "balance": credit.balance,
        "user_id": str(user.id)
    }


@app.get("/api/mobile/styles")
def mobile_get_styles():
    """Get available enhancement styles for mobile"""
    return {
        "styles": [
            {
                "id": "luster",
                "name": "Luster",
                "description": "Luster AI signature style - luxury editorial real estate photography"
            },
            {
                "id": "flambient",
                "name": "Flambient",
                "description": "Bright, airy interior with crisp whites and flambient lighting"
            }
        ]
    }


# ============================================================================
# RQ Dashboard Integration (Optional)
# ============================================================================

# Try to mount RQ Dashboard if Redis is available
try:
    import redis
    from rq import Queue

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
            logger.warning("rq-dashboard-fast not installed. Install with: pip install rq-dashboard-fast")
    else:
        logger.info("REDIS_URL not set, skipping RQ Dashboard")
except Exception as e:
    logger.warning(f"Could not initialize RQ Dashboard: {e}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
