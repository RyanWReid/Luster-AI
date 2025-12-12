"""
Tests for RevenueCat webhook signature verification

These tests ensure that:
1. Valid signatures are accepted
2. Invalid signatures are rejected
3. Missing signatures are rejected (when secret is configured)
4. Webhooks work in development mode (no secret configured)
"""

import hashlib
import hmac
import json
import os
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base, Credit, User, get_db
from main import app

# Test database setup
TEST_DATABASE_URL = "sqlite:///./test_revenuecat.db"
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


class TestWebhookSignatureVerification:
    """Tests for webhook signature verification"""

    TEST_SECRET = "test_webhook_secret_12345"

    def _generate_signature(self, body: bytes, secret: str) -> str:
        """Generate a valid HMAC-SHA256 signature"""
        return hmac.new(
            key=secret.encode("utf-8"),
            msg=body,
            digestmod=hashlib.sha256,
        ).hexdigest()

    def _make_webhook_payload(
        self, event_type: str, app_user_id: str, product_id: str
    ) -> dict:
        """Create a sample webhook payload"""
        return {
            "event": {
                "type": event_type,
                "app_user_id": app_user_id,
                "product_id": product_id,
                "subscriber_attributes": {"$email": {"value": "test@example.com"}},
            }
        }

    @pytest.mark.api
    def test_valid_signature_accepted(self, client, test_db):
        """Webhook with valid signature should be accepted"""
        payload = self._make_webhook_payload(
            "NON_RENEWING_PURCHASE", "test-user-123", "com.lusterai.credits.small"
        )
        body = json.dumps(payload).encode("utf-8")
        signature = self._generate_signature(body, self.TEST_SECRET)

        with patch.dict(os.environ, {"REVENUECAT_WEBHOOK_SECRET": self.TEST_SECRET}):
            # Need to reimport to pick up the env var
            import revenue_cat

            revenue_cat.REVENUECAT_WEBHOOK_SECRET = self.TEST_SECRET

            response = client.post(
                "/api/webhooks/revenuecat",
                content=body,
                headers={
                    "Content-Type": "application/json",
                    "X-RevenueCat-Signature": signature,
                },
            )

            assert response.status_code == 200
            assert response.json()["status"] == "ok"

    @pytest.mark.api
    def test_invalid_signature_rejected(self, client, test_db):
        """Webhook with invalid signature should be rejected"""
        payload = self._make_webhook_payload(
            "NON_RENEWING_PURCHASE", "test-user-123", "com.lusterai.credits.small"
        )
        body = json.dumps(payload).encode("utf-8")
        wrong_signature = "invalid_signature_12345"

        with patch.dict(os.environ, {"REVENUECAT_WEBHOOK_SECRET": self.TEST_SECRET}):
            import revenue_cat

            revenue_cat.REVENUECAT_WEBHOOK_SECRET = self.TEST_SECRET

            response = client.post(
                "/api/webhooks/revenuecat",
                content=body,
                headers={
                    "Content-Type": "application/json",
                    "X-RevenueCat-Signature": wrong_signature,
                },
            )

            assert response.status_code == 401
            assert "Invalid signature" in response.json()["detail"]

    @pytest.mark.api
    def test_missing_signature_rejected(self, client, test_db):
        """Webhook without signature should be rejected when secret is configured"""
        payload = self._make_webhook_payload(
            "NON_RENEWING_PURCHASE", "test-user-123", "com.lusterai.credits.small"
        )
        body = json.dumps(payload).encode("utf-8")

        with patch.dict(os.environ, {"REVENUECAT_WEBHOOK_SECRET": self.TEST_SECRET}):
            import revenue_cat

            revenue_cat.REVENUECAT_WEBHOOK_SECRET = self.TEST_SECRET

            response = client.post(
                "/api/webhooks/revenuecat",
                content=body,
                headers={"Content-Type": "application/json"},
                # No signature header
            )

            assert response.status_code == 401

    @pytest.mark.api
    def test_development_mode_no_secret(self, client, test_db):
        """Webhook should work without secret in development mode"""
        payload = self._make_webhook_payload(
            "NON_RENEWING_PURCHASE", "test-user-dev", "com.lusterai.credits.small"
        )
        body = json.dumps(payload).encode("utf-8")

        # Clear the secret to simulate development mode
        import revenue_cat

        original_secret = revenue_cat.REVENUECAT_WEBHOOK_SECRET
        revenue_cat.REVENUECAT_WEBHOOK_SECRET = None

        try:
            response = client.post(
                "/api/webhooks/revenuecat",
                content=body,
                headers={"Content-Type": "application/json"},
            )

            # Should succeed (with warning logged)
            assert response.status_code == 200
        finally:
            revenue_cat.REVENUECAT_WEBHOOK_SECRET = original_secret

    @pytest.mark.api
    def test_tampered_body_rejected(self, client, test_db):
        """Webhook where body was tampered after signing should be rejected"""
        original_payload = self._make_webhook_payload(
            "NON_RENEWING_PURCHASE",
            "test-user-123",
            "com.lusterai.credits.small",  # Original: 5 credits
        )
        original_body = json.dumps(original_payload).encode("utf-8")
        signature = self._generate_signature(original_body, self.TEST_SECRET)

        # Tamper with the body after signing - try to get more credits
        tampered_payload = self._make_webhook_payload(
            "NON_RENEWING_PURCHASE",
            "test-user-123",
            "com.lusterai.credits.large",  # Tampered: 30 credits
        )
        tampered_body = json.dumps(tampered_payload).encode("utf-8")

        with patch.dict(os.environ, {"REVENUECAT_WEBHOOK_SECRET": self.TEST_SECRET}):
            import revenue_cat

            revenue_cat.REVENUECAT_WEBHOOK_SECRET = self.TEST_SECRET

            response = client.post(
                "/api/webhooks/revenuecat",
                content=tampered_body,  # Tampered body
                headers={
                    "Content-Type": "application/json",
                    "X-RevenueCat-Signature": signature,  # Original signature
                },
            )

            # Should be rejected because signature doesn't match tampered body
            assert response.status_code == 401


class TestWebhookCreditHandling:
    """Tests for credit handling via webhooks"""

    @pytest.mark.api
    def test_non_renewing_purchase_adds_credits(self, client, test_db):
        """NON_RENEWING_PURCHASE should add credits to user"""
        import revenue_cat

        revenue_cat.REVENUECAT_WEBHOOK_SECRET = None  # Dev mode

        user_id = "credit-test-user"
        payload = {
            "event": {
                "type": "NON_RENEWING_PURCHASE",
                "app_user_id": user_id,
                "product_id": "com.lusterai.credits.small",  # 5 credits
                "subscriber_attributes": {},
            }
        }

        response = client.post(
            "/api/webhooks/revenuecat",
            json=payload,
        )

        assert response.status_code == 200

        # Verify credits were added
        credit = test_db.query(Credit).filter(Credit.user_id == user_id).first()
        assert credit is not None
        assert credit.balance == 5

    @pytest.mark.api
    def test_initial_purchase_adds_credits(self, client, test_db):
        """INITIAL_PURCHASE should add credits to user"""
        import revenue_cat

        revenue_cat.REVENUECAT_WEBHOOK_SECRET = None  # Dev mode

        user_id = "initial-purchase-user"
        payload = {
            "event": {
                "type": "INITIAL_PURCHASE",
                "app_user_id": user_id,
                "product_id": "com.lusterai.pro.monthly",  # 45 credits
                "subscriber_attributes": {},
            }
        }

        response = client.post(
            "/api/webhooks/revenuecat",
            json=payload,
        )

        assert response.status_code == 200

        # Verify credits were added
        credit = test_db.query(Credit).filter(Credit.user_id == user_id).first()
        assert credit is not None
        assert credit.balance == 45
