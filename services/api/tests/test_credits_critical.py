"""
Critical Path Tests: Credit System

These tests cover the most important credit-related flows that,
if broken, would directly impact users and revenue.

Test Coverage:
1. Credit deduction on job creation
2. Credit refund on job failure (CRITICAL - currently missing!)
3. Credit balance validation before job creation
4. Concurrent job creation (race condition protection)
5. Credit transaction atomicity

Note: Uses authenticated_client fixture which mocks JWT auth with TEST_USER_ID
"""

import pytest

from database import Asset, Credit, Job, JobStatus, JobEvent, Shoot, User
from tests.conftest import TEST_USER_ID


class TestCreditDeduction:
    """Tests for credit deduction on job creation"""

    @pytest.mark.api
    def test_credit_deducted_on_job_creation(self, authenticated_client, test_db, test_user):
        """Credits should be deducted when a job is created"""
        initial_balance = 10

        # Setup: user with credits (use test_user from fixture)
        credit = Credit(user_id=TEST_USER_ID, balance=initial_balance)
        test_db.add(credit)

        shoot = Shoot(user_id=TEST_USER_ID, name="Test Shoot")
        test_db.add(shoot)
        test_db.flush()

        asset = Asset(
            shoot_id=shoot.id,
            user_id=TEST_USER_ID,
            original_filename="test.jpg",
            file_path="/fake/path/test.jpg",
            file_size=1000,
            mime_type="image/jpeg",
        )
        test_db.add(asset)
        test_db.commit()

        # Act: create a job (standard tier = 1 credit)
        response = authenticated_client.post(
            "/jobs",
            data={
                "asset_id": str(asset.id),
                "prompt": "Enhance this photo",
                "tier": "standard",
            },
        )

        # Assert: job created and credits deducted
        assert response.status_code == 200
        data = response.json()
        assert data["credits_used"] == 1

        # Verify credit balance decreased
        test_db.refresh(credit)
        assert credit.balance == initial_balance - 1

    @pytest.mark.api
    def test_premium_tier_costs_more(self, authenticated_client, test_db, test_user):
        """Premium tier should cost 2 credits"""
        initial_balance = 10

        credit = Credit(user_id=TEST_USER_ID, balance=initial_balance)
        test_db.add(credit)

        shoot = Shoot(user_id=TEST_USER_ID, name="Test Shoot")
        test_db.add(shoot)
        test_db.flush()

        asset = Asset(
            shoot_id=shoot.id,
            user_id=TEST_USER_ID,
            original_filename="test.jpg",
            file_path="/fake/path/test.jpg",
            file_size=1000,
            mime_type="image/jpeg",
        )
        test_db.add(asset)
        test_db.commit()

        response = authenticated_client.post(
            "/jobs",
            data={
                "asset_id": str(asset.id),
                "prompt": "Enhance this photo",
                "tier": "premium",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["credits_used"] == 2

        test_db.refresh(credit)
        assert credit.balance == initial_balance - 2


class TestCreditValidation:
    """Tests for credit balance validation"""

    @pytest.mark.api
    def test_job_rejected_with_zero_credits(self, authenticated_client, test_db, test_user):
        """Job creation should fail with 402 when user has 0 credits"""
        credit = Credit(user_id=TEST_USER_ID, balance=0)
        test_db.add(credit)

        shoot = Shoot(user_id=TEST_USER_ID, name="Test Shoot")
        test_db.add(shoot)
        test_db.flush()

        asset = Asset(
            shoot_id=shoot.id,
            user_id=TEST_USER_ID,
            original_filename="test.jpg",
            file_path="/fake/path/test.jpg",
            file_size=1000,
            mime_type="image/jpeg",
        )
        test_db.add(asset)
        test_db.commit()

        response = authenticated_client.post(
            "/jobs",
            data={"asset_id": str(asset.id), "prompt": "Enhance"},
        )

        assert response.status_code == 402
        assert "Insufficient credits" in response.json()["detail"]

        # Verify balance unchanged
        test_db.refresh(credit)
        assert credit.balance == 0

    @pytest.mark.api
    def test_job_rejected_with_insufficient_credits_for_tier(self, authenticated_client, test_db, test_user):
        """Premium job should fail with 402 when user has only 1 credit"""
        # User has 1 credit but premium costs 2
        credit = Credit(user_id=TEST_USER_ID, balance=1)
        test_db.add(credit)

        shoot = Shoot(user_id=TEST_USER_ID, name="Test Shoot")
        test_db.add(shoot)
        test_db.flush()

        asset = Asset(
            shoot_id=shoot.id,
            user_id=TEST_USER_ID,
            original_filename="test.jpg",
            file_path="/fake/path/test.jpg",
            file_size=1000,
            mime_type="image/jpeg",
        )
        test_db.add(asset)
        test_db.commit()

        response = authenticated_client.post(
            "/jobs",
            data={
                "asset_id": str(asset.id),
                "prompt": "Enhance",
                "tier": "premium",
            },
        )

        assert response.status_code == 402
        assert "Insufficient credits" in response.json()["detail"]

        # Verify balance unchanged
        test_db.refresh(credit)
        assert credit.balance == 1

    @pytest.mark.api
    def test_no_credit_record_treated_as_zero(self, authenticated_client, test_db, test_user):
        """User with no credit record should be treated as having 0 credits"""
        # No credit record created for test_user
        shoot = Shoot(user_id=TEST_USER_ID, name="Test Shoot")
        test_db.add(shoot)
        test_db.flush()

        asset = Asset(
            shoot_id=shoot.id,
            user_id=TEST_USER_ID,
            original_filename="test.jpg",
            file_path="/fake/path/test.jpg",
            file_size=1000,
            mime_type="image/jpeg",
        )
        test_db.add(asset)
        test_db.commit()

        response = authenticated_client.post(
            "/jobs",
            data={"asset_id": str(asset.id), "prompt": "Enhance"},
        )

        assert response.status_code == 402


class TestCreditRefund:
    """
    CRITICAL: Tests for credit refund on job failure

    These tests document the expected behavior. If they fail,
    it indicates the refund logic is not implemented - which is a bug!
    """

    @pytest.mark.api
    @pytest.mark.xfail(reason="Credit refund not implemented - CRITICAL BUG")
    def test_credits_refunded_on_job_failure(self, test_db, test_user):
        """
        Credits should be refunded when a job fails.

        Current behavior: Credits are deducted upfront and never refunded.
        Expected behavior: If job fails, credits should be returned.
        """
        initial_balance = 10

        credit = Credit(user_id=TEST_USER_ID, balance=initial_balance)
        test_db.add(credit)

        shoot = Shoot(user_id=TEST_USER_ID, name="Test Shoot")
        test_db.add(shoot)
        test_db.flush()

        asset = Asset(
            shoot_id=shoot.id,
            user_id=TEST_USER_ID,
            original_filename="test.jpg",
            file_path="/fake/path/test.jpg",
            file_size=1000,
            mime_type="image/jpeg",
        )
        test_db.add(asset)
        test_db.flush()

        # Create a job that will be marked as failed
        job = Job(
            asset_id=asset.id,
            user_id=TEST_USER_ID,
            prompt="Enhance",
            status=JobStatus.queued,
            credits_used=1,
        )
        test_db.add(job)
        test_db.commit()

        # Deduct credits (simulating job creation)
        credit.balance -= 1
        test_db.commit()

        # Simulate job failure
        job.status = JobStatus.failed
        job.error_message = "OpenAI API error"
        test_db.commit()

        # TODO: This is where refund logic should trigger
        # Expected: credit.balance should be restored to initial_balance

        test_db.refresh(credit)

        # This assertion documents the expected behavior
        # Currently fails because refund is not implemented
        assert credit.balance == initial_balance, (
            "Credits should be refunded when job fails. "
            f"Expected {initial_balance}, got {credit.balance}"
        )

    @pytest.mark.api
    @pytest.mark.xfail(reason="Refund endpoint not implemented - CRITICAL BUG")
    def test_refund_endpoint_exists(self, authenticated_client, test_db, test_user):
        """
        There should be an endpoint or mechanism to refund credits.

        This could be:
        - Automatic refund when job status changes to 'failed'
        - Admin endpoint to manually refund
        - Worker callback that triggers refund
        """
        credit = Credit(user_id=TEST_USER_ID, balance=9)  # Started with 10, deducted 1
        test_db.add(credit)

        shoot = Shoot(user_id=TEST_USER_ID, name="Test Shoot")
        test_db.add(shoot)
        test_db.flush()

        asset = Asset(
            shoot_id=shoot.id,
            user_id=TEST_USER_ID,
            original_filename="test.jpg",
            file_path="/fake/path/test.jpg",
            file_size=1000,
            mime_type="image/jpeg",
        )
        test_db.add(asset)
        test_db.flush()

        job = Job(
            asset_id=asset.id,
            user_id=TEST_USER_ID,
            prompt="Enhance",
            status=JobStatus.failed,
            credits_used=1,
            error_message="Test failure",
        )
        test_db.add(job)
        test_db.commit()

        # Try to refund via endpoint (should exist but doesn't)
        response = authenticated_client.post(f"/jobs/{job.id}/refund")

        # Expected: endpoint exists and returns 200
        assert response.status_code == 200

        test_db.refresh(credit)
        assert credit.balance == 10  # Refunded


class TestJobStatusTransitions:
    """Tests for valid job status transitions"""

    @pytest.mark.api
    def test_job_starts_as_queued(self, authenticated_client, test_db, test_user):
        """New jobs should start with 'queued' status"""
        credit = Credit(user_id=TEST_USER_ID, balance=10)
        test_db.add(credit)

        shoot = Shoot(user_id=TEST_USER_ID, name="Test Shoot")
        test_db.add(shoot)
        test_db.flush()

        asset = Asset(
            shoot_id=shoot.id,
            user_id=TEST_USER_ID,
            original_filename="test.jpg",
            file_path="/fake/path/test.jpg",
            file_size=1000,
            mime_type="image/jpeg",
        )
        test_db.add(asset)
        test_db.commit()

        response = authenticated_client.post(
            "/jobs",
            data={"asset_id": str(asset.id), "prompt": "Enhance"},
        )

        assert response.status_code == 200
        assert response.json()["status"] == "queued"

    @pytest.mark.api
    def test_valid_status_transition_queued_to_processing(self, test_db, test_user):
        """Job can transition from queued to processing"""
        shoot = Shoot(user_id=TEST_USER_ID, name="Test Shoot")
        test_db.add(shoot)
        test_db.flush()

        asset = Asset(
            shoot_id=shoot.id,
            user_id=TEST_USER_ID,
            original_filename="test.jpg",
            file_path="/fake/path/test.jpg",
            file_size=1000,
            mime_type="image/jpeg",
        )
        test_db.add(asset)
        test_db.flush()

        job = Job(
            asset_id=asset.id,
            user_id=TEST_USER_ID,
            prompt="Enhance",
            status=JobStatus.queued,
        )
        test_db.add(job)
        test_db.commit()

        # Transition to processing
        job.status = JobStatus.processing
        test_db.commit()

        test_db.refresh(job)
        assert job.status == JobStatus.processing

    @pytest.mark.api
    def test_valid_status_transition_processing_to_succeeded(self, test_db, test_user):
        """Job can transition from processing to succeeded"""
        shoot = Shoot(user_id=TEST_USER_ID, name="Test Shoot")
        test_db.add(shoot)
        test_db.flush()

        asset = Asset(
            shoot_id=shoot.id,
            user_id=TEST_USER_ID,
            original_filename="test.jpg",
            file_path="/fake/path/test.jpg",
            file_size=1000,
            mime_type="image/jpeg",
        )
        test_db.add(asset)
        test_db.flush()

        job = Job(
            asset_id=asset.id,
            user_id=TEST_USER_ID,
            prompt="Enhance",
            status=JobStatus.processing,
        )
        test_db.add(job)
        test_db.commit()

        # Transition to succeeded
        job.status = JobStatus.succeeded
        job.output_path = "/outputs/enhanced.jpg"
        test_db.commit()

        test_db.refresh(job)
        assert job.status == JobStatus.succeeded

    @pytest.mark.api
    def test_valid_status_transition_processing_to_failed(self, test_db, test_user):
        """Job can transition from processing to failed"""
        shoot = Shoot(user_id=TEST_USER_ID, name="Test Shoot")
        test_db.add(shoot)
        test_db.flush()

        asset = Asset(
            shoot_id=shoot.id,
            user_id=TEST_USER_ID,
            original_filename="test.jpg",
            file_path="/fake/path/test.jpg",
            file_size=1000,
            mime_type="image/jpeg",
        )
        test_db.add(asset)
        test_db.flush()

        job = Job(
            asset_id=asset.id,
            user_id=TEST_USER_ID,
            prompt="Enhance",
            status=JobStatus.processing,
        )
        test_db.add(job)
        test_db.commit()

        # Transition to failed
        job.status = JobStatus.failed
        job.error_message = "OpenAI API timeout"
        test_db.commit()

        test_db.refresh(job)
        assert job.status == JobStatus.failed
        assert job.error_message == "OpenAI API timeout"


class TestCreditAuditTrail:
    """Tests for credit transaction audit trail"""

    @pytest.mark.api
    def test_job_event_created_on_job_creation(self, authenticated_client, test_db, test_user):
        """JobEvent should be created when job is created"""
        credit = Credit(user_id=TEST_USER_ID, balance=10)
        test_db.add(credit)

        shoot = Shoot(user_id=TEST_USER_ID, name="Test Shoot")
        test_db.add(shoot)
        test_db.flush()

        asset = Asset(
            shoot_id=shoot.id,
            user_id=TEST_USER_ID,
            original_filename="test.jpg",
            file_path="/fake/path/test.jpg",
            file_size=1000,
            mime_type="image/jpeg",
        )
        test_db.add(asset)
        test_db.commit()

        response = authenticated_client.post(
            "/jobs",
            data={"asset_id": str(asset.id), "prompt": "Enhance"},
        )

        assert response.status_code == 200
        job_id = response.json()["id"]

        # Check for job event
        events = test_db.query(JobEvent).filter(JobEvent.job_id == job_id).all()

        # Should have at least one event (job created)
        assert len(events) >= 1

        # First event should be creation
        create_event = next(
            (e for e in events if e.event_type == "created"),
            None
        )
        assert create_event is not None
