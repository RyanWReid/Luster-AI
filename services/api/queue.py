"""
Redis Queue setup for job processing
"""

import os

import redis
from dotenv import load_dotenv
from rq import Connection, Queue

load_dotenv()

# Redis connection
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_conn = redis.from_url(redis_url)

# Job queues with different priorities
high_priority_queue = Queue("high", connection=redis_conn)
default_queue = Queue("default", connection=redis_conn)
low_priority_queue = Queue("low", connection=redis_conn)


def get_queue(priority: str = "default") -> Queue:
    """Get queue by priority"""
    queues = {
        "high": high_priority_queue,
        "default": default_queue,
        "low": low_priority_queue,
    }
    return queues.get(priority, default_queue)


def enqueue_job(
    func, *args, priority: str = "default", job_timeout: str = "10m", **kwargs
):
    """Enqueue a job with specified priority"""
    queue = get_queue(priority)
    return queue.enqueue(func, *args, job_timeout=job_timeout, **kwargs)


def get_job_status(job_id: str):
    """Get job status from Redis"""
    from rq import job

    try:
        rq_job = job.Job.fetch(job_id, connection=redis_conn)
        return {
            "id": rq_job.id,
            "status": rq_job.get_status(),
            "result": rq_job.result,
            "exc_info": rq_job.exc_info,
            "created_at": rq_job.created_at,
            "started_at": rq_job.started_at,
            "ended_at": rq_job.ended_at,
        }
    except Exception as e:
        return {"error": str(e)}


def get_queue_info():
    """Get information about all queues"""
    return {
        "high": {
            "length": len(high_priority_queue),
            "failed_count": len(high_priority_queue.failed_job_registry),
        },
        "default": {
            "length": len(default_queue),
            "failed_count": len(default_queue.failed_job_registry),
        },
        "low": {
            "length": len(low_priority_queue),
            "failed_count": len(low_priority_queue.failed_job_registry),
        },
    }


# Health check for Redis connection
def redis_health_check():
    """Check if Redis is healthy"""
    try:
        redis_conn.ping()
        return {"status": "healthy", "redis": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "redis": "disconnected", "error": str(e)}
