"""
Admin monitoring endpoints for Luster AI
Provides visibility into workers, queues, jobs, and system health
"""

import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from database import Asset, Job, JobEvent, JobStatus, User, get_db

router = APIRouter(prefix="/admin", tags=["admin"])


# ============================================================================
# Health & System Status
# ============================================================================


@router.get("/health")
def get_detailed_health(db: Session = Depends(get_db)):
    """
    Comprehensive system health check
    Returns status of database, Redis, workers, and recent job statistics
    """
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {},
        "workers": {},
        "queues": {},
    }

    # Check database
    try:
        db.execute(text("SELECT 1"))
        health_status["services"]["database"] = {
            "status": "healthy",
            "latency_ms": 0,  # Could add actual timing
        }
    except Exception as e:
        health_status["services"]["database"] = {
            "status": "unhealthy",
            "error": str(e),
        }
        health_status["status"] = "degraded"

    # Check Redis (if available)
    try:
        from job_queue import redis_health_check

        redis_status = redis_health_check()
        health_status["services"]["redis"] = redis_status
        if redis_status.get("status") == "unhealthy":
            health_status["status"] = "degraded"
    except ImportError:
        health_status["services"]["redis"] = {
            "status": "not_configured",
            "note": "Redis Queue not enabled",
        }
    except Exception as e:
        health_status["services"]["redis"] = {"status": "unhealthy", "error": str(e)}
        health_status["status"] = "degraded"

    # Check worker activity
    worker_stats = get_worker_activity(db)
    health_status["workers"] = worker_stats

    # Get queue stats
    try:
        from job_queue import get_queue_info

        health_status["queues"] = get_queue_info()
    except (ImportError, Exception) as e:
        health_status["queues"] = {"error": str(e)}

    return health_status


# ============================================================================
# Worker Monitoring
# ============================================================================


def get_worker_activity(db: Session) -> Dict:
    """
    Infer worker activity from recent job processing
    Since we don't have explicit worker heartbeats yet, we look at job timestamps
    """
    now = datetime.utcnow()
    five_minutes_ago = now - timedelta(minutes=5)

    # Count jobs processed in last 5 minutes
    active_jobs = (
        db.query(Job)
        .filter(
            Job.status == JobStatus.processing,
            Job.started_at >= five_minutes_ago,
        )
        .count()
    )

    # Count jobs completed in last 5 minutes
    recent_completions = (
        db.query(Job)
        .filter(
            Job.status.in_([JobStatus.succeeded, JobStatus.failed]),
            Job.completed_at >= five_minutes_ago,
        )
        .count()
    )

    # Estimate if workers are active
    workers_active = active_jobs > 0 or recent_completions > 0

    return {
        "estimated_active": 1 if workers_active else 0,
        "jobs_processing": active_jobs,
        "recent_completions_5min": recent_completions,
        "note": "Worker tracking via job activity. Enable heartbeat for accurate counts.",
    }


@router.get("/workers")
def get_workers(db: Session = Depends(get_db)):
    """
    Get worker status and activity
    Returns inferred worker info from job processing patterns
    """
    return get_worker_activity(db)


# ============================================================================
# Job Statistics
# ============================================================================


@router.get("/jobs/stats")
def get_job_stats(
    hours: int = 24,
    db: Session = Depends(get_db),
):
    """
    Get job statistics for the specified time period

    Args:
        hours: Number of hours to look back (default: 24)
    """
    time_threshold = datetime.utcnow() - timedelta(hours=hours)

    # Jobs by status
    jobs_by_status = (
        db.query(Job.status, func.count(Job.id))
        .filter(Job.created_at >= time_threshold)
        .group_by(Job.status)
        .all()
    )

    # Calculate success rate
    total_completed = (
        db.query(func.count(Job.id))
        .filter(
            Job.status.in_([JobStatus.succeeded, JobStatus.failed]),
            Job.completed_at >= time_threshold,
        )
        .scalar()
    )

    successful = (
        db.query(func.count(Job.id))
        .filter(
            Job.status == JobStatus.succeeded,
            Job.completed_at >= time_threshold,
        )
        .scalar()
    )

    success_rate = (successful / total_completed * 100) if total_completed > 0 else 0

    # Average processing time
    avg_processing_time = (
        db.query(func.avg(func.extract("epoch", Job.completed_at - Job.started_at)))
        .filter(
            Job.status == JobStatus.succeeded,
            Job.completed_at >= time_threshold,
        )
        .scalar()
    )

    return {
        "period_hours": hours,
        "jobs_by_status": {status.value: count for status, count in jobs_by_status},
        "total_jobs": sum(count for _, count in jobs_by_status),
        "success_rate_percent": round(success_rate, 2),
        "avg_processing_time_seconds": (
            round(avg_processing_time, 2) if avg_processing_time else None
        ),
        "total_completed": total_completed,
        "successful": successful,
        "failed": total_completed - successful if total_completed > 0 else 0,
    }


@router.get("/jobs/recent")
def get_recent_jobs(
    limit: int = 20,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Get recent jobs with optional status filter

    Args:
        limit: Number of jobs to return (default: 20, max: 100)
        status: Filter by status (queued, processing, succeeded, failed)
    """
    limit = min(limit, 100)  # Cap at 100

    query = db.query(Job).order_by(Job.created_at.desc())

    if status:
        try:
            job_status = JobStatus[status]
            query = query.filter(Job.status == job_status)
        except KeyError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: {[s.value for s in JobStatus]}",
            )

    jobs = query.limit(limit).all()

    return {
        "jobs": [
            {
                "id": str(job.id),
                "status": job.status.value,
                "asset_id": str(job.asset_id),
                "user_id": str(job.user_id),
                "credits_used": job.credits_used,
                "created_at": job.created_at.isoformat(),
                "started_at": job.started_at.isoformat() if job.started_at else None,
                "completed_at": (
                    job.completed_at.isoformat() if job.completed_at else None
                ),
                "error_message": job.error_message,
                "processing_time_seconds": (
                    (job.completed_at - job.started_at).total_seconds()
                    if job.completed_at and job.started_at
                    else None
                ),
            }
            for job in jobs
        ],
        "total": len(jobs),
        "limit": limit,
    }


# ============================================================================
# System Metrics
# ============================================================================


@router.get("/metrics")
def get_system_metrics(db: Session = Depends(get_db)):
    """
    Get overall system metrics
    Returns counts and performance indicators
    """
    # Total counts
    total_users = db.query(func.count(User.id)).scalar()
    total_assets = db.query(func.count(Asset.id)).scalar()
    total_jobs = db.query(func.count(Job.id)).scalar()

    # Jobs in last 24 hours
    yesterday = datetime.utcnow() - timedelta(days=1)
    jobs_24h = db.query(func.count(Job.id)).filter(Job.created_at >= yesterday).scalar()

    # Queue depth
    queued_jobs = (
        db.query(func.count(Job.id)).filter(Job.status == JobStatus.queued).scalar()
    )
    processing_jobs = (
        db.query(func.count(Job.id)).filter(Job.status == JobStatus.processing).scalar()
    )

    return {
        "totals": {
            "users": total_users,
            "assets": total_assets,
            "jobs": total_jobs,
        },
        "activity_24h": {
            "jobs_created": jobs_24h,
        },
        "current_queue": {
            "queued": queued_jobs,
            "processing": processing_jobs,
        },
        "timestamp": datetime.utcnow().isoformat(),
    }


# ============================================================================
# Admin Dashboard UI
# ============================================================================


@router.get("/dashboard", response_class=HTMLResponse)
def admin_dashboard():
    """
    Simple HTML dashboard for monitoring system health
    Uses HTMX for live updates without JavaScript framework
    """
    html = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Luster AI - Admin Dashboard</title>
    <script src="https://unpkg.com/htmx.org@1.9.10"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @keyframes pulse-green {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        .status-pulse {
            animation: pulse-green 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
    </style>
</head>
<body class="bg-gray-900 text-gray-100 p-8">
    <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
            <h1 class="text-4xl font-bold mb-2">Luster AI Admin</h1>
            <p class="text-gray-400">System Monitoring & Health Dashboard</p>
        </div>

        <!-- System Health -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <!-- Health Status -->
            <div class="bg-gray-800 rounded-lg p-6"
                 hx-get="/admin/health"
                 hx-trigger="every 5s"
                 hx-swap="innerHTML">
                <h2 class="text-xl font-semibold mb-4 flex items-center">
                    <span class="w-3 h-3 bg-green-500 rounded-full mr-3 status-pulse"></span>
                    System Health
                </h2>
                <p class="text-gray-400">Loading...</p>
            </div>

            <!-- Job Statistics -->
            <div class="bg-gray-800 rounded-lg p-6"
                 hx-get="/admin/jobs/stats"
                 hx-trigger="every 10s"
                 hx-swap="innerHTML">
                <h2 class="text-xl font-semibold mb-4">Job Statistics (24h)</h2>
                <p class="text-gray-400">Loading...</p>
            </div>
        </div>

        <!-- Workers & Queues -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <!-- Workers -->
            <div class="bg-gray-800 rounded-lg p-6"
                 hx-get="/admin/workers"
                 hx-trigger="every 5s"
                 hx-swap="innerHTML">
                <h2 class="text-xl font-semibold mb-4">Workers</h2>
                <p class="text-gray-400">Loading...</p>
            </div>

            <!-- System Metrics -->
            <div class="bg-gray-800 rounded-lg p-6"
                 hx-get="/admin/metrics"
                 hx-trigger="every 15s"
                 hx-swap="innerHTML">
                <h2 class="text-xl font-semibold mb-4">System Metrics</h2>
                <p class="text-gray-400">Loading...</p>
            </div>
        </div>

        <!-- Recent Jobs -->
        <div class="bg-gray-800 rounded-lg p-6"
             hx-get="/admin/jobs/recent?limit=10"
             hx-trigger="every 10s"
             hx-swap="innerHTML">
            <h2 class="text-xl font-semibold mb-4">Recent Jobs</h2>
            <p class="text-gray-400">Loading...</p>
        </div>

        <!-- Footer -->
        <div class="mt-8 text-center text-gray-500 text-sm">
            <p>Auto-refreshing dashboard • Last updated: <span id="timestamp"></span></p>
        </div>
    </div>

    <script>
        // Update timestamp
        setInterval(() => {
            document.getElementById('timestamp').textContent = new Date().toLocaleTimeString();
        }, 1000);
    </script>
</body>
</html>
    """
    return html
