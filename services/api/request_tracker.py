"""
Request tracking middleware and storage for monitoring photo processing lifecycle
"""

import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from collections import deque
import threading

# Thread-safe in-memory storage for recent requests
# In production, this could be Redis or a time-series database
_request_log = deque(maxlen=100)  # Keep last 100 requests
_lock = threading.Lock()


class RequestTracker:
    """Track individual requests through the system"""

    def __init__(self, request_id: str, endpoint: str, method: str):
        self.request_id = request_id
        self.endpoint = endpoint
        self.method = method
        self.start_time = time.time()
        self.phases: List[Dict] = []
        self.metadata: Dict = {}

    def add_phase(self, phase_name: str, duration_ms: float = None, metadata: dict = None):
        """Record a phase of the request lifecycle"""
        if duration_ms is None:
            duration_ms = (time.time() - self.start_time) * 1000

        phase_data = {
            "name": phase_name,
            "duration_ms": duration_ms,
            "timestamp": datetime.utcnow().isoformat(),
        }

        if metadata:
            phase_data["metadata"] = metadata

        self.phases.append(phase_data)

    def set_metadata(self, key: str, value):
        """Add metadata to the request"""
        self.metadata[key] = value

    def complete(self, status_code: int, error: str = None):
        """Mark request as complete and store in log"""
        total_duration = (time.time() - self.start_time) * 1000

        request_data = {
            "request_id": self.request_id,
            "endpoint": self.endpoint,
            "method": self.method,
            "status_code": status_code,
            "total_duration_ms": total_duration,
            "start_time": datetime.fromtimestamp(self.start_time).isoformat(),
            "end_time": datetime.utcnow().isoformat(),
            "phases": self.phases,
            "metadata": self.metadata,
            "error": error,
        }

        with _lock:
            _request_log.append(request_data)


def get_recent_requests(limit: int = 50, endpoint_filter: str = None) -> List[Dict]:
    """Get recent requests from the log"""
    with _lock:
        requests = list(_request_log)

    # Filter by endpoint if specified
    if endpoint_filter:
        requests = [r for r in requests if endpoint_filter in r["endpoint"]]

    # Return most recent first
    return sorted(requests, key=lambda x: x["start_time"], reverse=True)[:limit]


def get_active_requests() -> List[Dict]:
    """Get requests that started recently but haven't completed (potential processing)"""
    cutoff = datetime.utcnow() - timedelta(minutes=5)

    with _lock:
        requests = list(_request_log)

    # Find requests from last 5 minutes
    recent = [
        r for r in requests
        if datetime.fromisoformat(r["start_time"]) > cutoff
    ]

    return sorted(recent, key=lambda x: x["start_time"], reverse=True)


def get_endpoint_stats(minutes: int = 60) -> Dict:
    """Get statistics for each endpoint"""
    cutoff = datetime.utcnow() - timedelta(minutes=minutes)

    with _lock:
        requests = list(_request_log)

    # Filter to time window
    recent = [
        r for r in requests
        if datetime.fromisoformat(r["start_time"]) > cutoff
    ]

    stats = {}
    for req in recent:
        endpoint = req["endpoint"]
        if endpoint not in stats:
            stats[endpoint] = {
                "count": 0,
                "total_duration_ms": 0,
                "avg_duration_ms": 0,
                "min_duration_ms": float('inf'),
                "max_duration_ms": 0,
                "errors": 0,
            }

        s = stats[endpoint]
        s["count"] += 1
        s["total_duration_ms"] += req["total_duration_ms"]
        s["min_duration_ms"] = min(s["min_duration_ms"], req["total_duration_ms"])
        s["max_duration_ms"] = max(s["max_duration_ms"], req["total_duration_ms"])

        if req["status_code"] >= 400:
            s["errors"] += 1

    # Calculate averages
    for endpoint, s in stats.items():
        if s["count"] > 0:
            s["avg_duration_ms"] = s["total_duration_ms"] / s["count"]

    return stats


def clear_old_requests(minutes: int = 60):
    """Clear requests older than specified minutes (maintenance function)"""
    cutoff = datetime.utcnow() - timedelta(minutes=minutes)

    with _lock:
        # Filter out old requests
        filtered = [
            r for r in _request_log
            if datetime.fromisoformat(r["start_time"]) > cutoff
        ]
        _request_log.clear()
        _request_log.extend(filtered)
