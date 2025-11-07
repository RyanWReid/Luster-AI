"""
Middleware for request tracking and monitoring
"""

import time
import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from request_tracker import RequestTracker


class RequestTrackingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to track requests through the system
    Captures timing and metadata for monitoring
    """

    async def dispatch(self, request: Request, call_next):
        # Generate unique request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        # Skip tracking for health checks and static assets
        if request.url.path.startswith("/admin") or request.url.path == "/health":
            return await call_next(request)

        # Create tracker
        tracker = RequestTracker(
            request_id=request_id,
            endpoint=request.url.path,
            method=request.method
        )

        # Store tracker in request state for use in endpoints
        request.state.tracker = tracker

        # Add initial metadata
        tracker.set_metadata("client_ip", request.client.host if request.client else None)
        tracker.set_metadata("user_agent", request.headers.get("user-agent", "unknown"))

        # Process request
        start_time = time.time()
        error = None
        status_code = 500

        try:
            response = await call_next(request)
            status_code = response.status_code

            # Add response metadata
            tracker.set_metadata("response_size", response.headers.get("content-length", 0))

            return response

        except Exception as e:
            error = str(e)
            raise

        finally:
            # Record total request time
            duration_ms = (time.time() - start_time) * 1000
            tracker.add_phase("total_request", duration_ms)

            # Complete tracking
            tracker.complete(status_code, error)
