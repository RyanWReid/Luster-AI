"""
Quick test script for monitoring endpoints
Run with: python test_monitoring.py
"""

import sys
from fastapi.testclient import TestClient

# Import the app
from main import app

client = TestClient(app)


def test_admin_endpoints():
    """Test all admin monitoring endpoints"""
    print("Testing Admin Monitoring Endpoints\n" + "=" * 50)

    tests = [
        ("/admin/health", "System Health"),
        ("/admin/workers", "Worker Status"),
        ("/admin/jobs/stats", "Job Statistics"),
        ("/admin/jobs/recent?limit=5", "Recent Jobs"),
        ("/admin/metrics", "System Metrics"),
        ("/admin/dashboard", "Dashboard UI"),
    ]

    passed = 0
    failed = 0

    for endpoint, name in tests:
        try:
            response = client.get(endpoint)
            if response.status_code == 200:
                print(f"✓ {name:30} {endpoint}")
                passed += 1
            else:
                print(f"✗ {name:30} {endpoint} - Status {response.status_code}")
                failed += 1
        except Exception as e:
            print(f"✗ {name:30} {endpoint} - Error: {e}")
            failed += 1

    print("\n" + "=" * 50)
    print(f"Results: {passed} passed, {failed} failed")

    return failed == 0


def test_health_response_structure():
    """Test that health endpoint returns expected structure"""
    print("\nTesting Health Response Structure\n" + "=" * 50)

    response = client.get("/admin/health")
    data = response.json()

    expected_keys = ["status", "timestamp", "services", "workers", "queues"]
    missing_keys = [key for key in expected_keys if key not in data]

    if missing_keys:
        print(f"✗ Missing keys: {missing_keys}")
        return False

    print("✓ Health response has all expected keys")
    print(f"  - Status: {data['status']}")
    print(f"  - Database: {data['services'].get('database', {}).get('status', 'unknown')}")
    print(f"  - Workers: {data['workers'].get('estimated_active', 'unknown')}")

    return True


def test_job_stats_response():
    """Test job stats endpoint returns valid data"""
    print("\nTesting Job Stats Response\n" + "=" * 50)

    response = client.get("/admin/jobs/stats?hours=24")
    data = response.json()

    expected_keys = [
        "period_hours",
        "jobs_by_status",
        "total_jobs",
        "success_rate_percent",
    ]
    missing_keys = [key for key in expected_keys if key not in data]

    if missing_keys:
        print(f"✗ Missing keys: {missing_keys}")
        return False

    print("✓ Job stats response has all expected keys")
    print(f"  - Total jobs (24h): {data['total_jobs']}")
    print(f"  - Success rate: {data['success_rate_percent']}%")
    print(f"  - Jobs by status: {data['jobs_by_status']}")

    return True


if __name__ == "__main__":
    print("Luster AI Monitoring Test Suite\n")

    all_passed = True

    all_passed &= test_admin_endpoints()
    all_passed &= test_health_response_structure()
    all_passed &= test_job_stats_response()

    print("\n" + "=" * 50)
    if all_passed:
        print("✓ All tests passed!")
        sys.exit(0)
    else:
        print("✗ Some tests failed")
        sys.exit(1)
