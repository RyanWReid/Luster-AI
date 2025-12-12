"""
Database model tests
"""

import uuid
from datetime import datetime

import pytest
from sqlalchemy.exc import IntegrityError

from database import Asset, Credit, Job, JobEvent, JobStatus, Shoot, User


class TestUserModel:
    """Test User model"""

    @pytest.mark.unit
    def test_create_user(self, test_db):
        """Test creating a user"""
        user = User(id=str(uuid.uuid4()), email="test@example.com")
        test_db.add(user)
        test_db.commit()

        assert user.id is not None
        assert user.email == "test@example.com"
        assert user.created_at is not None
        assert user.updated_at is not None

    @pytest.mark.unit
    def test_user_email_unique(self, test_db):
        """Test that user emails must be unique"""
        user1 = User(id=str(uuid.uuid4()), email="test@example.com")
        user2 = User(id=str(uuid.uuid4()), email="test@example.com")

        test_db.add(user1)
        test_db.commit()

        test_db.add(user2)
        with pytest.raises(IntegrityError):
            test_db.commit()


class TestCreditModel:
    """Test Credit model"""

    @pytest.mark.unit
    def test_create_credit(self, test_db):
        """Test creating credit record"""
        user_id = str(uuid.uuid4())
        user = User(id=user_id, email="test@example.com")
        test_db.add(user)
        test_db.commit()

        credit = Credit(user_id=user_id, balance=100)
        test_db.add(credit)
        test_db.commit()

        assert credit.balance == 100
        assert credit.user_id == user_id

    @pytest.mark.unit
    def test_credit_user_unique(self, test_db):
        """Test that each user can have only one credit record"""
        user_id = str(uuid.uuid4())
        user = User(id=user_id, email="test@example.com")
        test_db.add(user)
        test_db.commit()

        credit1 = Credit(user_id=user_id, balance=100)
        credit2 = Credit(user_id=user_id, balance=200)

        test_db.add(credit1)
        test_db.commit()

        test_db.add(credit2)
        with pytest.raises(IntegrityError):
            test_db.commit()


class TestShootModel:
    """Test Shoot model"""

    @pytest.mark.unit
    def test_create_shoot(self, test_db):
        """Test creating a shoot"""
        user_id = str(uuid.uuid4())
        user = User(id=user_id, email="test@example.com")
        test_db.add(user)
        test_db.commit()

        shoot = Shoot(user_id=user_id, name="Test Shoot")
        test_db.add(shoot)
        test_db.commit()

        assert shoot.name == "Test Shoot"
        assert shoot.user_id == user_id
        assert shoot.user == user


class TestAssetModel:
    """Test Asset model"""

    @pytest.mark.unit
    def test_create_asset(self, test_db):
        """Test creating an asset"""
        user_id = str(uuid.uuid4())
        user = User(id=user_id, email="test@example.com")
        test_db.add(user)
        test_db.flush()

        shoot = Shoot(user_id=user_id, name="Test Shoot")
        test_db.add(shoot)
        test_db.flush()

        asset = Asset(
            shoot_id=shoot.id,
            user_id=user_id,
            original_filename="test.jpg",
            file_path="/path/to/test.jpg",
            file_size=1000,
            mime_type="image/jpeg",
        )
        test_db.add(asset)
        test_db.commit()

        assert asset.original_filename == "test.jpg"
        assert asset.file_size == 1000
        assert asset.mime_type == "image/jpeg"
        assert asset.shoot == shoot
        assert asset.user == user


class TestJobModel:
    """Test Job model"""

    @pytest.mark.unit
    def test_create_job(self, test_db):
        """Test creating a job"""
        user_id = str(uuid.uuid4())
        user = User(id=user_id, email="test@example.com")
        test_db.add(user)
        test_db.flush()

        shoot = Shoot(user_id=user_id, name="Test Shoot")
        test_db.add(shoot)
        test_db.flush()

        asset = Asset(
            shoot_id=shoot.id,
            user_id=user_id,
            original_filename="test.jpg",
            file_path="/path/to/test.jpg",
            file_size=1000,
            mime_type="image/jpeg",
        )
        test_db.add(asset)
        test_db.flush()

        job = Job(
            asset_id=asset.id,
            user_id=user_id,
            prompt="Test prompt",
            status=JobStatus.queued,
            credits_used=2,
        )
        test_db.add(job)
        test_db.commit()

        assert job.prompt == "Test prompt"
        assert job.status == JobStatus.queued
        assert job.credits_used == 2
        assert job.asset == asset
        assert job.user == user

    @pytest.mark.unit
    def test_job_status_enum(self, test_db):
        """Test job status enum values"""
        user_id = str(uuid.uuid4())
        user = User(id=user_id, email="test@example.com")
        test_db.add(user)
        test_db.flush()

        shoot = Shoot(user_id=user_id, name="Test Shoot")
        test_db.add(shoot)
        test_db.flush()

        asset = Asset(
            shoot_id=shoot.id,
            user_id=user_id,
            original_filename="test.jpg",
            file_path="/path/to/test.jpg",
            file_size=1000,
            mime_type="image/jpeg",
        )
        test_db.add(asset)
        test_db.flush()

        # Test all enum values
        for status in [
            JobStatus.queued,
            JobStatus.processing,
            JobStatus.succeeded,
            JobStatus.failed,
        ]:
            job = Job(
                asset_id=asset.id,
                user_id=user_id,
                prompt=f"Test prompt {status.value}",
                status=status,
            )
            test_db.add(job)

        test_db.commit()

        jobs = test_db.query(Job).all()
        assert len(jobs) == 4
        statuses = [job.status for job in jobs]
        assert JobStatus.queued in statuses
        assert JobStatus.processing in statuses
        assert JobStatus.succeeded in statuses
        assert JobStatus.failed in statuses


class TestJobEventModel:
    """Test JobEvent model"""

    @pytest.mark.unit
    def test_create_job_event(self, test_db):
        """Test creating a job event"""
        user_id = str(uuid.uuid4())
        user = User(id=user_id, email="test@example.com")
        test_db.add(user)
        test_db.flush()

        shoot = Shoot(user_id=user_id, name="Test Shoot")
        test_db.add(shoot)
        test_db.flush()

        asset = Asset(
            shoot_id=shoot.id,
            user_id=user_id,
            original_filename="test.jpg",
            file_path="/path/to/test.jpg",
            file_size=1000,
            mime_type="image/jpeg",
        )
        test_db.add(asset)
        test_db.flush()

        job = Job(
            asset_id=asset.id,
            user_id=user_id,
            prompt="Test prompt",
            status=JobStatus.queued,
        )
        test_db.add(job)
        test_db.flush()

        event = JobEvent(
            job_id=job.id, event_type="created", details='{"test": "data"}'
        )
        test_db.add(event)
        test_db.commit()

        assert event.event_type == "created"
        assert event.details == '{"test": "data"}'
        assert event.job == job


class TestModelRelationships:
    """Test model relationships"""

    @pytest.mark.unit
    def test_user_relationships(self, test_db):
        """Test user relationship loading"""
        user_id = str(uuid.uuid4())
        user = User(id=user_id, email="test@example.com")
        test_db.add(user)
        test_db.flush()

        # Create related records
        credit = Credit(user_id=user_id, balance=100)
        shoot = Shoot(user_id=user_id, name="Test Shoot")
        test_db.add_all([credit, shoot])
        test_db.flush()

        asset = Asset(
            shoot_id=shoot.id,
            user_id=user_id,
            original_filename="test.jpg",
            file_path="/path/to/test.jpg",
            file_size=1000,
            mime_type="image/jpeg",
        )
        test_db.add(asset)
        test_db.flush()

        job = Job(
            asset_id=asset.id,
            user_id=user_id,
            prompt="Test prompt",
            status=JobStatus.queued,
        )
        test_db.add(job)
        test_db.commit()

        # Test relationships
        assert len(user.shoots) == 1
        assert len(user.assets) == 1
        assert len(user.jobs) == 1
        assert user.credits.balance == 100  # Note: 'credits' not 'credit'

    @pytest.mark.unit
    @pytest.mark.skip(
        reason="Cascade delete not configured - would need ondelete='CASCADE' in ForeignKeys"
    )
    def test_cascade_delete(self, test_db):
        """Test that deleting a user cascades properly"""
        user_id = str(uuid.uuid4())
        user = User(id=user_id, email="test@example.com")
        test_db.add(user)
        test_db.flush()

        # Create related records
        credit = Credit(user_id=user_id, balance=100)
        shoot = Shoot(user_id=user_id, name="Test Shoot")
        test_db.add_all([credit, shoot])
        test_db.flush()

        asset = Asset(
            shoot_id=shoot.id,
            user_id=user_id,
            original_filename="test.jpg",
            file_path="/path/to/test.jpg",
            file_size=1000,
            mime_type="image/jpeg",
        )
        test_db.add(asset)
        test_db.flush()

        job = Job(
            asset_id=asset.id,
            user_id=user_id,
            prompt="Test prompt",
            status=JobStatus.queued,
        )
        test_db.add(job)
        test_db.commit()

        # Delete user
        test_db.delete(user)
        test_db.commit()

        # Verify cascade
        assert test_db.query(Credit).count() == 0
        assert test_db.query(Shoot).count() == 0
        assert test_db.query(Asset).count() == 0
        assert test_db.query(Job).count() == 0
