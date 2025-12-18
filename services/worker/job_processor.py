"""
RQ Job processor for image enhancement tasks
"""

import json
import os
import uuid
from datetime import datetime

import sentry_sdk
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from database import Asset, Credit, Job, JobEvent, JobStatus
from processor import ImageProcessor

# Database setup for worker
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://luster:luster_dev@localhost:5432/luster"
)
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def process_image_enhancement(job_id: str):
    """
    Process image enhancement job using RQ
    This function will be called by RQ workers
    """
    db = SessionLocal()
    try:
        # Get job from database
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise ValueError(f"Job {job_id} not found")

        print(f"\n=== RQ PROCESSING JOB {job_id} ===")

        # Update job status to processing
        job.status = JobStatus.processing
        job.started_at = datetime.utcnow()
        db.commit()

        # Add job event
        add_job_event(db, job.id, "started", {"started_at": job.started_at.isoformat()})

        # Get asset info
        asset = db.query(Asset).filter(Asset.id == job.asset_id).first()
        if not asset:
            raise ValueError(f"Asset {job.asset_id} not found")

        print(f"Processing asset: {asset.original_filename}")
        print(f"Prompt: {job.prompt}")
        print(f"Credits: {job.credits_used}")

        # Validate input file exists
        if not os.path.exists(asset.file_path):
            raise FileNotFoundError(f"Input file not found: {asset.file_path}")

        # Initialize image processor
        processor = ImageProcessor(os.getenv("OPENAI_API_KEY"))

        # Extract tier information from job events
        tier = "premium"  # default
        try:
            creation_event = (
                db.query(JobEvent)
                .filter(JobEvent.job_id == job.id, JobEvent.event_type == "created")
                .first()
            )
            if creation_event and creation_event.details:
                if isinstance(creation_event.details, str):
                    details = json.loads(creation_event.details)
                else:
                    details = creation_event.details
                tier = details.get("tier", "premium")
        except Exception as e:
            print(f"Could not extract tier: {e}")

        # Generate output path
        outputs_dir = os.getenv("OUTPUTS_DIR", "../../outputs")
        output_filename = f"{job.id}.jpg"
        output_path = os.path.join(outputs_dir, output_filename)

        print(f"Processing with tier: {tier}")
        print(f"Output path: {output_path}")

        # Process the image
        result = processor.process_image(
            input_path=asset.file_path,
            prompt=job.prompt,
            output_path=output_path,
            tier=tier,
        )

        if result.get("success", False):
            # Update job as succeeded
            # Note: Credits already deducted upfront at job creation
            job.status = JobStatus.succeeded
            job.output_path = output_path
            job.completed_at = datetime.utcnow()

            db.commit()

            # Add success event
            add_job_event(
                db,
                job.id,
                "completed",
                {
                    "output_path": output_path,
                    "completed_at": job.completed_at.isoformat(),
                    "credits_used": job.credits_used,
                    "style_preset": result.get("style_preset"),
                    "room_type": result.get("room_type"),
                    "file_size": result.get("file_size"),
                    "prompt_used": result.get("prompt_used", "")[:200],
                },
            )

            print(f"Job {job_id} completed successfully")
            return {
                "success": True,
                "job_id": job_id,
                "output_path": output_path,
                "credits_used": job.credits_used,
            }

        else:
            error_detail = result.get("error", "Image processing failed")
            raise Exception(error_detail)

    except Exception as e:
        error_msg = str(e)
        print(f"Job {job_id} failed: {error_msg}")

        # Capture exception in Sentry
        sentry_sdk.capture_exception(e)

        # Update job as failed
        job = db.query(Job).filter(Job.id == job_id).first()
        if job:
            job.status = JobStatus.failed
            job.error_message = error_msg
            job.completed_at = datetime.utcnow()

            # Refund credits on failure (credits were reserved at job creation)
            # Check for existing refund to prevent double-refund
            existing_refund = (
                db.query(JobEvent)
                .filter(
                    JobEvent.job_id == job.id,
                    JobEvent.event_type == "credits_refunded"
                )
                .first()
            )
            if existing_refund:
                print(f"⚠️  Credits already refunded for job {job.id}, skipping refund")
            else:
                credit = db.query(Credit).filter(Credit.user_id == job.user_id).first()
                if credit:
                    credit.balance += job.credits_used
                    print(f"Refunded {job.credits_used} credits to user {job.user_id}")

            db.commit()

            # Add failure event
            add_job_event(
                db,
                job.id,
                "failed",
                {
                    "error_message": error_msg,
                    "completed_at": job.completed_at.isoformat(),
                    "credits_refunded": job.credits_used,
                },
            )

        # Re-raise the exception for RQ to handle
        raise

    finally:
        db.close()


def add_job_event(db: Session, job_id: str, event_type: str, details: dict):
    """Add a job event to the audit trail"""
    try:
        event = JobEvent(
            job_id=job_id, event_type=event_type, details=json.dumps(details)
        )
        db.add(event)
        db.commit()
    except Exception as e:
        print(f"Error adding job event: {e}")
        db.rollback()


def get_job_priority(credits_used: int, user_tier: str = "free") -> str:
    """Determine job priority based on credits and user tier"""
    if user_tier == "premium" or credits_used > 1:
        return "high"
    elif credits_used == 1:
        return "default"
    else:
        return "low"
