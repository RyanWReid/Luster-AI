"""
Rate limiting configuration for API endpoints

Uses slowapi to prevent abuse and protect against:
- Brute force attacks on authentication
- Credit system abuse
- API flooding
"""

import os

from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address


def get_user_identifier(request: Request) -> str:
    """
    Get rate limit key based on user or IP.

    - Authenticated requests: limit by user_id
    - Unauthenticated requests: limit by IP address
    """
    # Try to get user from request state (set by auth middleware)
    if hasattr(request.state, "user") and request.state.user:
        return f"user:{request.state.user.id}"

    # Fall back to IP address
    return f"ip:{get_remote_address(request)}"


# Create limiter instance
limiter = Limiter(
    key_func=get_user_identifier,
    default_limits=["200/minute"],  # Default: 200 requests per minute
    storage_uri=os.getenv("REDIS_URL", "memory://"),  # Use Redis in production
)


# Rate limit configurations for different endpoint types
RATE_LIMITS = {
    # Auth endpoints - strict limits to prevent brute force
    "auth": "5/minute",
    # Job creation - prevent credit abuse
    "job_create": "10/minute",
    # Upload endpoints - moderate limits
    "upload": "30/minute",
    # Read endpoints - more generous
    "read": "100/minute",
    # Webhook endpoints - allow more for async processing
    "webhook": "100/minute",
    # Health check - unlimited for monitoring
    "health": "1000/minute",
}


def rate_limit_exceeded_handler(
    request: Request, exc: RateLimitExceeded
) -> JSONResponse:
    """Custom handler for rate limit exceeded errors"""
    return JSONResponse(
        status_code=429,
        content={
            "error": "rate_limit_exceeded",
            "detail": f"Rate limit exceeded: {exc.detail}",
            "retry_after": getattr(exc, "retry_after", 60),
        },
        headers={"Retry-After": str(getattr(exc, "retry_after", 60))},
    )
