"""
Structured logging setup using structlog
"""

import logging
import os
import sys
from typing import Any, MutableMapping

import structlog
from structlog.typing import WrappedLogger


def setup_logging() -> WrappedLogger:
    """Configure structured logging for the application"""

    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    environment = os.getenv("ENVIRONMENT", "development")

    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, log_level),
    )

    # Add environment and service info
    def add_service_context(
        logger: WrappedLogger, method_name: str, event_dict: MutableMapping[str, Any]
    ) -> MutableMapping[str, Any]:
        event_dict["service"] = "luster-api"
        event_dict["environment"] = environment
        event_dict["version"] = os.getenv("APP_VERSION", "1.0.0")
        return event_dict

    # Configure structlog processors
    processors: list[Any] = [
        add_service_context,
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.dev.set_exc_info,
        structlog.processors.TimeStamper(fmt="ISO"),
    ]

    # Use JSON formatter in production, pretty formatter in development
    if environment == "production":
        processors.append(structlog.processors.JSONRenderer())
    else:
        processors.append(structlog.dev.ConsoleRenderer(colors=True))

    # Configure structlog
    structlog.configure(
        processors=processors,  # type: ignore[arg-type]
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(logging, log_level)
        ),
        logger_factory=structlog.WriteLoggerFactory(),
        cache_logger_on_first_use=True,
    )

    return structlog.get_logger()


# Global logger instance
logger = setup_logging()


# Logging utilities
def log_api_request(
    request_id: str, method: str, path: str, user_id: str | None = None
) -> None:
    """Log API request"""
    logger.info(
        "API request started",
        request_id=request_id,
        method=method,
        path=path,
        user_id=user_id,
        event_type="api_request_start",
    )


def log_api_response(request_id: str, status_code: int, duration_ms: float) -> None:
    """Log API response"""
    logger.info(
        "API request completed",
        request_id=request_id,
        status_code=status_code,
        duration_ms=duration_ms,
        event_type="api_request_end",
    )


def log_job_created(
    job_id: str, asset_id: str, user_id: str, credits_used: int
) -> None:
    """Log job creation"""
    logger.info(
        "Job created",
        job_id=job_id,
        asset_id=asset_id,
        user_id=user_id,
        credits_used=credits_used,
        event_type="job_created",
    )


def log_job_started(job_id: str, worker_id: str | None = None) -> None:
    """Log job processing start"""
    logger.info(
        "Job processing started",
        job_id=job_id,
        worker_id=worker_id,
        event_type="job_started",
    )


def log_job_completed(
    job_id: str, duration_ms: float, output_size: int | None = None
) -> None:
    """Log job completion"""
    logger.info(
        "Job completed successfully",
        job_id=job_id,
        duration_ms=duration_ms,
        output_size=output_size,
        event_type="job_completed",
    )


def log_job_failed(job_id: str, error: str, duration_ms: float | None = None) -> None:
    """Log job failure"""
    logger.error(
        "Job failed",
        job_id=job_id,
        error=error,
        duration_ms=duration_ms,
        event_type="job_failed",
    )


def log_upload_started(
    asset_id: str, filename: str, file_size: int, user_id: str
) -> None:
    """Log file upload start"""
    logger.info(
        "File upload started",
        asset_id=asset_id,
        filename=filename,
        file_size=file_size,
        user_id=user_id,
        event_type="upload_started",
    )


def log_upload_completed(asset_id: str, duration_ms: float) -> None:
    """Log file upload completion"""
    logger.info(
        "File upload completed",
        asset_id=asset_id,
        duration_ms=duration_ms,
        event_type="upload_completed",
    )


def log_credit_transaction(
    user_id: str, amount: int, operation: str, balance_after: int
) -> None:
    """Log credit transactions"""
    logger.info(
        "Credit transaction",
        user_id=user_id,
        amount=amount,
        operation=operation,  # "deduct", "add", "refund"
        balance_after=balance_after,
        event_type="credit_transaction",
    )


def log_health_check(status: str, services: dict[str, Any]) -> None:
    """Log health check results"""
    logger.info(
        "Health check performed",
        status=status,
        services=services,
        event_type="health_check",
    )


# Middleware for request logging
class LoggingMiddleware:
    """FastAPI middleware for structured request/response logging"""

    def __init__(self, app: Any) -> None:
        self.app = app

    async def __call__(self, scope: dict[str, Any], receive: Any, send: Any) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        import time
        import uuid

        request_id = str(uuid.uuid4())
        start_time = time.time()

        # Add request ID to context
        structlog.contextvars.bind_contextvars(request_id=request_id)

        # Log request start
        method: str = scope["method"]
        path: str = scope["path"]
        log_api_request(request_id, method, path)

        # Process request
        response_started = False
        status_code: int | None = None

        async def send_wrapper(message: dict[str, Any]) -> None:
            nonlocal response_started, status_code
            if message["type"] == "http.response.start":
                response_started = True
                status_code = message["status"]
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        finally:
            # Log response
            duration_ms = (time.time() - start_time) * 1000
            if response_started and status_code:
                log_api_response(request_id, status_code, duration_ms)

            # Clear context
            structlog.contextvars.clear_contextvars()
