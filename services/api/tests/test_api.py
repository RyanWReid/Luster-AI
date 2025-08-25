"""
API endpoint tests
"""

import json
import tempfile
import uuid
from io import BytesIO
from unittest.mock import patch

import pytest
from PIL import Image

from database import Asset, Credit, Job, JobStatus, Shoot, User


class TestHealthEndpoint:
    """Test health check endpoint"""

    @pytest.mark.unit
    def test_health_check(self, client):
        """Test health endpoint returns 200"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}


class TestShootEndpoints:
    """Test shoot-related endpoints"""

    @pytest.mark.api
    def test_create_shoot(self, client, test_db):
        """Test creating a new shoot"""
        response = client.post("/shoots", data={"name": "Test Shoot"})
        assert response.status_code == 200

        data = response.json()
        assert "id" in data
        assert data["name"] == "Test Shoot"

        # Verify shoot was created in database
        shoot = test_db.query(Shoot).filter(Shoot.name == "Test Shoot").first()
        assert shoot is not None
        assert str(shoot.id) == data["id"]

    @pytest.mark.api
    def test_create_shoot_empty_name(self, client):
        """Test creating shoot with empty name fails"""
        response = client.post("/shoots", data={"name": ""})
        assert response.status_code == 422  # Validation error

    @pytest.mark.api
    def test_get_shoot_assets_empty(self, client, test_db):
        """Test getting assets for a shoot with no assets"""
        # Create a shoot first
        shoot = Shoot(user_id="550e8400-e29b-41d4-a716-446655440000", name="Test Shoot")
        test_db.add(shoot)
        test_db.commit()

        response = client.get(f"/shoots/{shoot.id}/assets")
        assert response.status_code == 200

        data = response.json()
        assert data["shoot"]["id"] == str(shoot.id)
        assert data["shoot"]["name"] == "Test Shoot"
        assert data["assets"] == []

    @pytest.mark.api
    def test_get_nonexistent_shoot_assets(self, client):
        """Test getting assets for non-existent shoot"""
        fake_id = str(uuid.uuid4())
        response = client.get(f"/shoots/{fake_id}/assets")
        assert response.status_code == 404


class TestUploadEndpoints:
    """Test file upload endpoints"""

    def create_test_image_file(self):
        """Helper to create a test image file"""
        image = Image.new("RGB", (100, 100), color="red")
        img_bytes = BytesIO()
        image.save(img_bytes, format="JPEG")
        img_bytes.seek(0)
        return img_bytes

    @pytest.mark.api
    def test_upload_file_success(self, client, test_db, temp_uploads_dir):
        """Test successful file upload"""
        # Create a shoot first
        shoot = Shoot(user_id="550e8400-e29b-41d4-a716-446655440000", name="Test Shoot")
        test_db.add(shoot)
        test_db.commit()

        # Create test image
        img_data = self.create_test_image_file()

        response = client.post(
            "/uploads",
            data={"shoot_id": str(shoot.id)},
            files={"file": ("test.jpg", img_data, "image/jpeg")},
        )

        assert response.status_code == 200
        data = response.json()

        assert "id" in data
        assert data["filename"] == "test.jpg"
        assert data["size"] > 0

        # Verify asset was created in database
        asset = test_db.query(Asset).filter(Asset.id == data["id"]).first()
        assert asset is not None
        assert asset.original_filename == "test.jpg"
        assert asset.shoot_id == shoot.id

    @pytest.mark.api
    def test_upload_file_nonexistent_shoot(self, client, temp_uploads_dir):
        """Test upload with non-existent shoot ID"""
        fake_shoot_id = str(uuid.uuid4())
        img_data = self.create_test_image_file()

        response = client.post(
            "/uploads",
            data={"shoot_id": fake_shoot_id},
            files={"file": ("test.jpg", img_data, "image/jpeg")},
        )

        assert response.status_code == 404
        assert "Shoot not found" in response.json()["detail"]

    @pytest.mark.api
    def test_upload_empty_file(self, client, test_db, temp_uploads_dir):
        """Test upload with empty file"""
        # Create a shoot first
        shoot = Shoot(user_id="550e8400-e29b-41d4-a716-446655440000", name="Test Shoot")
        test_db.add(shoot)
        test_db.commit()

        response = client.post(
            "/uploads",
            data={"shoot_id": str(shoot.id)},
            files={"file": ("empty.jpg", BytesIO(b""), "image/jpeg")},
        )

        assert response.status_code == 400
        assert "empty" in response.json()["detail"].lower()


class TestJobEndpoints:
    """Test job-related endpoints"""

    @pytest.mark.api
    def test_create_job_success(self, client, test_db):
        """Test successful job creation"""
        # Setup: create user with credits, shoot, and asset
        user_id = "550e8400-e29b-41d4-a716-446655440000"

        # Create credit record
        credit = Credit(user_id=user_id, balance=10)
        test_db.add(credit)

        # Create shoot and asset
        shoot = Shoot(user_id=user_id, name="Test Shoot")
        test_db.add(shoot)
        test_db.flush()

        asset = Asset(
            shoot_id=shoot.id,
            user_id=user_id,
            original_filename="test.jpg",
            file_path="/fake/path/test.jpg",
            file_size=1000,
            mime_type="image/jpeg",
        )
        test_db.add(asset)
        test_db.commit()

        response = client.post(
            "/jobs",
            data={
                "asset_id": str(asset.id),
                "prompt": "Test prompt",
                "tier": "premium",
            },
        )

        assert response.status_code == 200
        data = response.json()

        assert "id" in data
        assert data["status"] == "queued"
        assert data["asset_id"] == str(asset.id)
        assert data["prompt"] == "Test prompt"
        assert data["credits_used"] == 2  # Premium tier

        # Verify job was created in database
        job = test_db.query(Job).filter(Job.id == data["id"]).first()
        assert job is not None
        assert job.status == JobStatus.queued

    @pytest.mark.api
    def test_create_job_insufficient_credits(self, client, test_db):
        """Test job creation with insufficient credits"""
        user_id = "550e8400-e29b-41d4-a716-446655440000"

        # Create credit record with 0 balance
        credit = Credit(user_id=user_id, balance=0)
        test_db.add(credit)

        # Create shoot and asset
        shoot = Shoot(user_id=user_id, name="Test Shoot")
        test_db.add(shoot)
        test_db.flush()

        asset = Asset(
            shoot_id=shoot.id,
            user_id=user_id,
            original_filename="test.jpg",
            file_path="/fake/path/test.jpg",
            file_size=1000,
            mime_type="image/jpeg",
        )
        test_db.add(asset)
        test_db.commit()

        response = client.post(
            "/jobs", data={"asset_id": str(asset.id), "prompt": "Test prompt"}
        )

        assert response.status_code == 402  # Payment required
        assert "Insufficient credits" in response.json()["detail"]

    @pytest.mark.api
    def test_get_job_success(self, client, test_db):
        """Test getting job details"""
        # Setup job
        user_id = "550e8400-e29b-41d4-a716-446655440000"

        shoot = Shoot(user_id=user_id, name="Test Shoot")
        test_db.add(shoot)
        test_db.flush()

        asset = Asset(
            shoot_id=shoot.id,
            user_id=user_id,
            original_filename="test.jpg",
            file_path="/fake/path/test.jpg",
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

        response = client.get(f"/jobs/{job.id}")
        assert response.status_code == 200

        data = response.json()
        assert data["id"] == str(job.id)
        assert data["status"] == "queued"
        assert data["prompt"] == "Test prompt"
        assert "created_at" in data
        assert "updated_at" in data

    @pytest.mark.api
    def test_get_nonexistent_job(self, client):
        """Test getting non-existent job"""
        fake_id = str(uuid.uuid4())
        response = client.get(f"/jobs/{fake_id}")
        assert response.status_code == 404


class TestCreditsEndpoint:
    """Test credits-related endpoints"""

    @pytest.mark.api
    def test_get_credits_with_balance(self, client, test_db):
        """Test getting credits when user has balance"""
        user_id = "550e8400-e29b-41d4-a716-446655440000"
        credit = Credit(user_id=user_id, balance=50)
        test_db.add(credit)
        test_db.commit()

        response = client.get("/credits")
        assert response.status_code == 200
        assert response.json() == {"balance": 50}

    @pytest.mark.api
    def test_get_credits_no_record(self, client, test_db):
        """Test getting credits when no record exists"""
        response = client.get("/credits")
        assert response.status_code == 200
        assert response.json() == {"balance": 0}
