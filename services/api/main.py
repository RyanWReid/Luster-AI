import json
import os
import shutil
import time
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

import sentry_sdk
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sqlalchemy.orm import Session

from database import (Asset, Credit, Job, JobEvent, JobStatus, Shoot, User,
                      get_db)
from logger import (LoggingMiddleware, log_credit_transaction,
                    log_health_check, log_job_created, log_upload_completed,
                    log_upload_started, logger)

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
        traces_sample_rate=0.1,  # 10% of transactions for performance monitoring
        environment=os.getenv("ENVIRONMENT", "development"),
        release=os.getenv("APP_VERSION", "1.0.0"),
    )
    logger.info("Sentry initialized")
else:
    logger.warning("SENTRY_DSN not set, Sentry not initialized")

app = FastAPI(title="Luster AI API", version="1.0.0")

# Add structured logging middleware
app.add_middleware(LoggingMiddleware)

# CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
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
DEFAULT_USER_ID = "550e8400-e29b-41d4-a716-446655440000"


@app.get("/health")
def health_check():
    """Health check endpoint with database and queue status"""
    health_status = {"status": "healthy", "services": {}}

    # Check database
    try:
        from database import SessionLocal

        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        health_status["services"]["database"] = "healthy"
    except Exception as e:
        health_status["services"]["database"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"

    # Check Redis/Queue
    try:
        from queue import get_queue_info, redis_health_check

        redis_status = redis_health_check()
        queue_info = get_queue_info()

        if redis_status["status"] == "healthy":
            health_status["services"]["redis"] = "healthy"
            health_status["services"]["queues"] = queue_info
        else:
            health_status["services"][
                "redis"
            ] = f"unhealthy: {redis_status.get('error', 'unknown')}"
            health_status["status"] = "degraded"

    except Exception as e:
        health_status["services"]["redis"] = f"unhealthy: {str(e)}"
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
        from queue import enqueue_job

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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
