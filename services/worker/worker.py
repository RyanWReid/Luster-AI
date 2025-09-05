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

class Worker:
    def __init__(self):
        self.db = SessionLocal()
        self.processor = ImageProcessor(os.getenv("OPENAI_API_KEY"))
        self.uploads_dir = os.getenv("UPLOADS_DIR", "../../uploads")
        self.outputs_dir = os.getenv("OUTPUTS_DIR", "../../outputs")
        
        # Ensure output directory exists
        Path(self.outputs_dir).mkdir(parents=True, exist_ok=True)
        
        print("Worker initialized")
        print(f"Uploads directory: {self.uploads_dir}")
        print(f"Outputs directory: {self.outputs_dir}")
    
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
            
            # Validate input file exists and get details
            if not os.path.exists(asset.file_path):
                raise Exception(f"Input file not found: {asset.file_path}")
            
            # Get file info
            file_stat = os.stat(asset.file_path)
            print(f"File system details:")
            print(f"  - File exists: {os.path.exists(asset.file_path)}")
            print(f"  - File size on disk: {file_stat.st_size} bytes")
            print(f"  - File permissions: {oct(file_stat.st_mode)[-3:]}")
            print(f"  - Is file: {os.path.isfile(asset.file_path)}")
            print(f"  - Is readable: {os.access(asset.file_path, os.R_OK)}")
            
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
            
            # Generate output filename
            output_filename = f"{job.id}.jpg"
            output_path = os.path.join(self.outputs_dir, output_filename)
            print(f"  - Output path: {output_path}")
            
            # Process the image
            print(f"\nCalling image processor...")
            result = self.processor.process_image(
                input_path=asset.file_path,
                prompt=job.prompt or "",  # Use empty string if no prompt
                output_path=output_path,
                style_preset=style_preset,
                tier=tier
            )
            print(f"Image processor result: {result}")
            
            if result.get("success", False):
                # Update job as succeeded
                job.status = JobStatus.succeeded
                job.output_path = output_path
                job.completed_at = datetime.utcnow()
                
                # Deduct credits
                credit = self.db.query(Credit).filter(Credit.user_id == job.user_id).first()
                if credit:
                    credit.balance -= job.credits_used
                
                self.db.commit()
                
                # Add success event with enhanced details
                self.add_job_event(job.id, "completed", {
                    "output_path": output_path,
                    "completed_at": job.completed_at.isoformat(),
                    "credits_used": job.credits_used,
                    "style_preset": result.get("style_preset"),
                    "room_type": result.get("room_type"),
                    "file_size": result.get("file_size"),
                    "prompt_used": result.get("prompt_used", "")[:200]  # Truncate for storage
                })
                
                print(f"Job {job.id} completed successfully")
                
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