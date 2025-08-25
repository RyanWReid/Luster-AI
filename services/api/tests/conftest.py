"""
Pytest configuration and fixtures
"""

import io
import os
import tempfile
import uuid
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from PIL import Image
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base, get_db
from main import app

# Test database URL - using SQLite for fast tests
TEST_DATABASE_URL = "sqlite:///./test.db"

# Create test engine
test_engine = create_engine(
    TEST_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def test_db():
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(test_db):
    """Create a test client with test database"""

    def override_get_db():
        try:
            yield test_db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def temp_image():
    """Create a temporary test image"""
    # Create a simple test image
    image = Image.new("RGB", (100, 100), color="red")

    # Save to temporary file
    temp_file = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
    image.save(temp_file.name, "JPEG")
    temp_file.close()

    yield temp_file.name

    # Cleanup
    if os.path.exists(temp_file.name):
        os.unlink(temp_file.name)


@pytest.fixture
def sample_user_data():
    """Sample user data for testing"""
    return {"id": str(uuid.uuid4()), "email": "test@example.com"}


@pytest.fixture
def sample_shoot_data():
    """Sample shoot data for testing"""
    return {"name": "Test Shoot"}


@pytest.fixture
def temp_uploads_dir():
    """Create temporary uploads directory"""
    temp_dir = tempfile.mkdtemp()
    original_uploads_dir = os.getenv("UPLOADS_DIR")
    os.environ["UPLOADS_DIR"] = temp_dir

    yield temp_dir

    # Cleanup
    if original_uploads_dir:
        os.environ["UPLOADS_DIR"] = original_uploads_dir
    else:
        os.environ.pop("UPLOADS_DIR", None)

    import shutil

    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture
def temp_outputs_dir():
    """Create temporary outputs directory"""
    temp_dir = tempfile.mkdtemp()
    original_outputs_dir = os.getenv("OUTPUTS_DIR")
    os.environ["OUTPUTS_DIR"] = temp_dir

    yield temp_dir

    # Cleanup
    if original_outputs_dir:
        os.environ["OUTPUTS_DIR"] = original_outputs_dir
    else:
        os.environ.pop("OUTPUTS_DIR", None)

    import shutil

    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture
def mock_openai_client(monkeypatch):
    """Mock OpenAI client for testing"""

    class MockOpenAIClient:
        def enhance_image(self, *args, **kwargs):
            return {
                "success": True,
                "image_data": b"fake_image_data",
                "style_preset": "test_style",
                "room_type": "test_room",
                "prompt_used": "test prompt",
            }

        def validate_image_file(self, *args, **kwargs):
            return {"valid": True}

    # Mock the ImageProcessor to use our mock client
    def mock_processor_init(self, api_key):
        self.openai_client = MockOpenAIClient()

    from services.worker import processor

    monkeypatch.setattr(processor.ImageProcessor, "__init__", mock_processor_init)
    return MockOpenAIClient()


# Markers for different test types
pytest.mark.unit = pytest.mark.unit
pytest.mark.integration = pytest.mark.integration
pytest.mark.api = pytest.mark.api
pytest.mark.worker = pytest.mark.worker
pytest.mark.slow = pytest.mark.slow
