#!/usr/bin/env python3
"""
RQ Worker for processing image enhancement jobs
"""
import os
import sys
from dotenv import load_dotenv
import redis
from rq import Worker, Queue, Connection
import sentry_sdk
from sentry_sdk.integrations.rq import RqIntegration

# Load environment variables
load_dotenv()

# Initialize Sentry for worker
sentry_dsn = os.getenv("SENTRY_DSN")
if sentry_dsn:
    sentry_sdk.init(
        dsn=sentry_dsn,
        integrations=[RqIntegration()],
        traces_sample_rate=0.1,
        environment=os.getenv("ENVIRONMENT", "development"),
        release=os.getenv("APP_VERSION", "1.0.0"),
    )
    print("Sentry initialized for RQ worker")

def main():
    """Main worker function"""
    # Redis connection
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    redis_conn = redis.from_url(redis_url)
    
    # Test Redis connection
    try:
        redis_conn.ping()
        print(f"✅ Connected to Redis: {redis_url}")
    except Exception as e:
        print(f"❌ Failed to connect to Redis: {e}")
        sys.exit(1)
    
    # Create queues in priority order (high priority first)
    queues = [
        Queue('high', connection=redis_conn),
        Queue('default', connection=redis_conn),
        Queue('low', connection=redis_conn)
    ]
    
    print(f"📋 Listening to queues: {[q.name for q in queues]}")
    print(f"🔄 Queue lengths: {[(q.name, len(q)) for q in queues]}")
    
    # Create worker
    worker = Worker(queues, connection=redis_conn)
    
    # Worker info
    print(f"🏷️  Worker ID: {worker.name}")
    print(f"🔧 Worker PID: {os.getpid()}")
    print(f"🌍 Environment: {os.getenv('ENVIRONMENT', 'development')}")
    print("🚀 Starting RQ worker...")
    
    # Start processing jobs
    try:
        worker.work(with_scheduler=True)
    except KeyboardInterrupt:
        print("\n🛑 Worker interrupted by user")
        worker.stop()
    except Exception as e:
        print(f"💥 Worker error: {e}")
        if sentry_dsn:
            sentry_sdk.capture_exception(e)
        raise

if __name__ == "__main__":
    main()