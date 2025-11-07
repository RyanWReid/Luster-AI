#!/usr/bin/env python3
"""
Luster AI Worker - Polls database for jobs and processes images
"""

import os
import time
import json
import uuid
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from database import SessionLocal, Job, JobEvent, Asset, Credit, JobStatus
from processor import ImageProcessor

load_dotenv()

# Try to import R2 client
try:
    from s3_client import r2_client
    R2_ENABLED = True
    print("✅ R2 client initialized successfully")
except Exception as e:
    R2_ENABLED = False
    print(f"⚠️  R2 client not available: {e}")
    print("   Worker will use local file storage only")

class Worker:
    def __init__(self):
        self.db = SessionLocal()
        self.processor = ImageProcessor(os.getenv("OPENAI_API_KEY"))
        self.uploads_dir = os.getenv("UPLOADS_DIR", "../../uploads")
        self.outputs_dir = os.getenv("OUTPUTS_DIR", "../../outputs")
        self.temp_dir = os.getenv("TEMP_DIR", "/tmp/luster-worker")

        # Ensure directories exist
        Path(self.uploads_dir).mkdir(parents=True, exist_ok=True)
        Path(self.outputs_dir).mkdir(parents=True, exist_ok=True)
        Path(self.temp_dir).mkdir(parents=True, exist_ok=True)

        self.r2_enabled = R2_ENABLED

        print("Worker initialized")
        print(f"Uploads directory: {self.uploads_dir}")
        print(f"Outputs directory: {self.outputs_dir}")
        print(f"Temp directory: {self.temp_dir}")
        print(f"R2 storage: {'enabled' if self.r2_enabled else 'disabled'}")
    
    def is_r2_path(self, file_path: str) -> bool:
        """Check if a file path is an R2 object key"""
        # R2 paths don't start with / and don't contain absolute path markers
        return self.r2_enabled and not file_path.startswith('/') and not file_path.startswith('.')

    def get_local_file_path(self, file_path: str) -> str:
        """
        Get local file path for processing.
        If file_path is an R2 key, download it to temp directory.
        Otherwise, return the path as-is (local file).
        """
        if self.is_r2_path(file_path):
            # Download from R2 to temp directory
            temp_filename = f"download_{uuid.uuid4()}_{os.path.basename(file_path)}"
            local_path = os.path.join(self.temp_dir, temp_filename)

            print(f"Downloading from R2: {file_path} → {local_path}")
            r2_client.download_file(file_path, local_path)

            return local_path
        else:
            # Local file path
            return file_path

    def upload_to_r2(self, local_path: str, object_key: str) -> str:
        """
        Upload a file to R2 storage.
        Returns the R2 object key.
        """
        if not self.r2_enabled:
            raise Exception("R2 not enabled, cannot upload")

        print(f"Uploading to R2: {local_path} → {object_key}")
        r2_client.upload_file(
            file_path=local_path,
            object_key=object_key,
            content_type="image/jpeg",
            metadata={"source": "luster-worker"}
        )

        return object_key

    def cleanup_temp_file(self, file_path: str):
        """Remove temporary file if it exists"""
        try:
            if file_path.startswith(self.temp_dir) and os.path.exists(file_path):
                os.remove(file_path)
                print(f"Cleaned up temp file: {file_path}")
        except Exception as e:
            print(f"Warning: Could not cleanup temp file {file_path}: {e}")

    def poll_jobs(self):
        """Poll database for queued jobs"""
        try:
            # Use SELECT FOR UPDATE SKIP LOCKED for job queuing
            job = self.db.query(Job).filter(
                Job.status == JobStatus.queued
            ).with_for_update(skip_locked=True).first()

            return job
        except Exception as e:
            print(f"Error polling jobs: {e}")
            return None
    
    def process_job(self, job: Job):
        """Process a single job"""
        print(f"\n=== PROCESSING JOB {job.id} ===")
        
        try:
            # Update job status to processing
            job.status = JobStatus.processing
            job.started_at = datetime.utcnow()
            self.db.commit()
            
            # Add job event
            self.add_job_event(job.id, "started", {"started_at": job.started_at.isoformat()})
            
            # Get asset info
            asset = self.db.query(Asset).filter(Asset.id == job.asset_id).first()
            if not asset:
                raise Exception("Asset not found")
            
            print(f"Asset details:")
            print(f"  - ID: {asset.id}")
            print(f"  - Original filename: {asset.original_filename}")
            print(f"  - File path: {asset.file_path}")
            print(f"  - File size: {asset.file_size}")
            print(f"  - MIME type: {asset.mime_type}")
            print(f"  - Storage type: {'R2' if self.is_r2_path(asset.file_path) else 'Local'}")

            # Get local file path (downloads from R2 if needed)
            input_file_path = self.get_local_file_path(asset.file_path)

            # Validate input file exists
            if not os.path.exists(input_file_path):
                raise Exception(f"Input file not found: {input_file_path}")

            # Get file info
            file_stat = os.stat(input_file_path)
            print(f"File system details:")
            print(f"  - Local path: {input_file_path}")
            print(f"  - File exists: {os.path.exists(input_file_path)}")
            print(f"  - File size on disk: {file_stat.st_size} bytes")
            print(f"  - File permissions: {oct(file_stat.st_mode)[-3:]}")
            print(f"  - Is file: {os.path.isfile(input_file_path)}")
            print(f"  - Is readable: {os.access(input_file_path, os.R_OK)}")

            # Extract tier and style information from prompt_params
            tier = "premium"  # default
            style_preset = "default"  # default
            try:
                if job.prompt_params:
                    params = json.loads(job.prompt_params)
                    tier = params.get("tier", "premium")
                    style_preset = params.get("style", "default")
                    print(f"Extracted from prompt_params - tier: {tier}, style: {style_preset}")
                else:
                    # Fallback to job events for backward compatibility
                    creation_event = self.db.query(JobEvent).filter(
                        JobEvent.job_id == job.id,
                        JobEvent.event_type == "created"
                    ).first()
                    if creation_event and creation_event.details:
                        details = json.loads(creation_event.details)
                        tier = details.get("tier", "premium")
                        style_preset = details.get("style", "default")
                        print(f"Extracted from job events - tier: {tier}, style: {style_preset}")
            except Exception as e:
                print(f"Could not extract parameters: {e}")

            print(f"Job processing parameters:")
            print(f"  - Prompt: {job.prompt}")
            print(f"  - Tier: {tier}")
            print(f"  - Credits to be used: {job.credits_used}")

            # Generate output filename - use temp directory for processing
            output_filename = f"{job.id}.jpg"
            temp_output_path = os.path.join(self.temp_dir, output_filename)
            print(f"  - Temp output path: {temp_output_path}")

            # Process the image
            print(f"\nCalling image processor...")
            result = self.processor.process_image(
                input_path=input_file_path,
                prompt=job.prompt or "",  # Use empty string if no prompt
                output_path=temp_output_path,
                style_preset=style_preset,
                tier=tier
            )
            print(f"Image processor result: {result}")

            if result.get("success", False):
                # Determine final output path
                if self.r2_enabled and self.is_r2_path(asset.file_path):
                    # Upload to R2 next to original file
                    # Extract user_id, shoot_id, asset_id from original path
                    path_parts = asset.file_path.split('/')
                    if len(path_parts) >= 4:
                        user_id = path_parts[0]
                        shoot_id = path_parts[1]
                        asset_id = path_parts[2]
                        output_object_key = f"{user_id}/{shoot_id}/{asset_id}/outputs/{job.id}.jpg"
                    else:
                        # Fallback if path structure is unexpected
                        output_object_key = f"outputs/{job.id}.jpg"

                    print(f"Uploading enhanced image to R2: {output_object_key}")
                    self.upload_to_r2(temp_output_path, output_object_key)
                    final_output_path = output_object_key
                else:
                    # Move to local outputs directory
                    final_output_path = os.path.join(self.outputs_dir, output_filename)
                    os.rename(temp_output_path, final_output_path)
                    print(f"Moved output to: {final_output_path}")

                # Update job as succeeded
                job.status = JobStatus.succeeded
                job.output_path = final_output_path
                job.completed_at = datetime.utcnow()

                # Deduct credits
                credit = self.db.query(Credit).filter(Credit.user_id == job.user_id).first()
                if credit:
                    credit.balance -= job.credits_used

                self.db.commit()

                # Add success event with enhanced details
                self.add_job_event(job.id, "completed", {
                    "output_path": final_output_path,
                    "storage_type": "R2" if self.is_r2_path(final_output_path) else "Local",
                    "completed_at": job.completed_at.isoformat(),
                    "credits_used": job.credits_used,
                    "style_preset": result.get("style_preset"),
                    "room_type": result.get("room_type"),
                    "file_size": result.get("file_size"),
                    "prompt_used": result.get("prompt_used", "")[:200]  # Truncate for storage
                })

                print(f"Job {job.id} completed successfully")
                print(f"Output saved to: {final_output_path}")

            else:
                # Get error details from result
                error_detail = result.get("error", "Image processing failed")
                raise Exception(error_detail)

        except Exception as e:
            error_msg = str(e)
            print(f"Job {job.id} failed: {error_msg}")

            # Update job as failed
            job.status = JobStatus.failed
            job.error_message = error_msg
            job.completed_at = datetime.utcnow()
            self.db.commit()

            # Add failure event
            self.add_job_event(job.id, "failed", {
                "error_message": error_msg,
                "completed_at": job.completed_at.isoformat()
            })

        finally:
            # Clean up temp files
            if 'input_file_path' in locals() and input_file_path and input_file_path != asset.file_path:
                self.cleanup_temp_file(input_file_path)
            if 'temp_output_path' in locals() and os.path.exists(temp_output_path):
                self.cleanup_temp_file(temp_output_path)
    
    def add_job_event(self, job_id: str, event_type: str, details: dict):
        """Add a job event to the audit trail"""
        try:
            event = JobEvent(
                job_id=job_id,
                event_type=event_type,
                details=json.dumps(details)
            )
            self.db.add(event)
            self.db.commit()
        except Exception as e:
            print(f"Error adding job event: {e}")
    
    def run(self):
        """Main worker loop"""
        print("Worker started - polling for jobs...")
        
        while True:
            try:
                job = self.poll_jobs()
                
                if job:
                    self.process_job(job)
                else:
                    # No jobs found, sleep for a bit
                    time.sleep(5)
                    
            except KeyboardInterrupt:
                print("Worker stopped by user")
                break
            except Exception as e:
                print(f"Unexpected error in worker loop: {e}")
                time.sleep(10)  # Wait before retrying
    
    def __del__(self):
        if hasattr(self, 'db'):
            self.db.close()

if __name__ == "__main__":
    worker = Worker()
    worker.run()