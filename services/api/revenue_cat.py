"""
RevenueCat webhook handler and integration

Handles webhook events from RevenueCat to sync subscription status
and credit balance with our backend.
"""

import hashlib
import hmac
import os
from typing import Any, Dict, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from database import Credit, User, get_db
from logger import logger

load_dotenv()

router = APIRouter(prefix="/api/webhooks/revenuecat", tags=["webhooks"])

# RevenueCat webhook shared secret for verification
# Get this from RevenueCat dashboard > Project Settings > Webhooks
REVENUECAT_WEBHOOK_SECRET = os.getenv("REVENUECAT_WEBHOOK_SECRET")


async def verify_webhook_signature(request: Request, body: bytes) -> bool:
    """
    Verify RevenueCat webhook signature using HMAC-SHA256.

    RevenueCat sends a X-RevenueCat-Signature header containing
    an HMAC-SHA256 signature of the request body.

    See: https://www.revenuecat.com/docs/webhooks#webhook-authentication
    """
    signature = request.headers.get("X-RevenueCat-Signature")

    if not REVENUECAT_WEBHOOK_SECRET:
        logger.warning(
            "REVENUECAT_WEBHOOK_SECRET not set - webhook verification disabled! "
            "Set this in production to prevent forged webhooks."
        )
        return True  # Allow in development, but log warning

    if not signature:
        logger.warning("Missing X-RevenueCat-Signature header - rejecting webhook")
        return False

    # Compute expected signature
    expected_signature = hmac.new(
        key=REVENUECAT_WEBHOOK_SECRET.encode("utf-8"),
        msg=body,
        digestmod=hashlib.sha256,
    ).hexdigest()

    # Use constant-time comparison to prevent timing attacks
    is_valid = hmac.compare_digest(signature, expected_signature)

    if not is_valid:
        logger.warning(
            f"Invalid webhook signature. Expected: {expected_signature[:16]}..., "
            f"Got: {signature[:16]}..."
        )

    return is_valid


def get_or_create_user(app_user_id: str, email: Optional[str], db: Session) -> User:
    """Get existing user or create new one"""
    user = db.query(User).filter(User.id == app_user_id).first()

    if not user:
        user = User(id=app_user_id, email=email or f"{app_user_id}@luster.ai")
        db.add(user)
        db.flush()
        logger.info(f"Created new user from RevenueCat: {app_user_id}")

    return user


def get_or_create_credit(user_id: str, db: Session) -> Credit:
    """Get existing credit balance or create new one"""
    credit = db.query(Credit).filter(Credit.user_id == user_id).first()

    if not credit:
        credit = Credit(user_id=user_id, balance=0)
        db.add(credit)
        db.flush()
        logger.info(f"Created credit balance for user: {user_id}")

    return credit


def handle_initial_purchase(event_data: Dict[str, Any], db: Session) -> None:
    """
    Handle INITIAL_PURCHASE event

    Triggered when a user makes their first purchase of any product.
    We'll use this to add credits to their account.
    """
    app_user_id = event_data.get("app_user_id")
    product_id = event_data.get("product_id")
    email = event_data.get("subscriber_attributes", {}).get("$email", {}).get("value")

    logger.info(f"Initial purchase: user={app_user_id}, product={product_id}")

    # Get or create user
    user = get_or_create_user(app_user_id, email, db)
    credit = get_or_create_credit(user.id, db)

    # Add credits based on product purchased
    credits_to_add = get_credits_for_product(product_id)

    if credits_to_add > 0:
        credit.balance += credits_to_add
        db.commit()
        logger.info(
            f"Added {credits_to_add} credits to user {app_user_id} (new balance: {credit.balance})"
        )


def handle_renewal(event_data: Dict[str, Any], db: Session) -> None:
    """
    Handle RENEWAL event

    Triggered when a subscription renews.
    We'll add credits for the new billing period.
    """
    app_user_id = event_data.get("app_user_id")
    product_id = event_data.get("product_id")

    logger.info(f"Subscription renewal: user={app_user_id}, product={product_id}")

    # Get user and credit
    user = db.query(User).filter(User.id == app_user_id).first()
    if not user:
        logger.warning(f"User not found for renewal: {app_user_id}")
        return

    credit = get_or_create_credit(user.id, db)

    # Add credits for renewal
    credits_to_add = get_credits_for_product(product_id)

    if credits_to_add > 0:
        credit.balance += credits_to_add
        db.commit()
        logger.info(
            f"Added {credits_to_add} credits to user {app_user_id} for renewal (new balance: {credit.balance})"
        )


def handle_cancellation(event_data: Dict[str, Any], db: Session) -> None:
    """
    Handle CANCELLATION event

    Triggered when a subscription is cancelled.
    User keeps access until expiration date.
    """
    app_user_id = event_data.get("app_user_id")
    product_id = event_data.get("product_id")
    expiration_at_ms = event_data.get("expiration_at_ms")

    logger.info(
        f"Subscription cancelled: user={app_user_id}, product={product_id}, expires_at={expiration_at_ms}"
    )

    # We don't remove credits immediately - they can use until expiration
    # You might want to add a flag to the user or send them a notification


def handle_expiration(event_data: Dict[str, Any], db: Session) -> None:
    """
    Handle EXPIRATION event

    Triggered when a subscription expires without renewal.
    """
    app_user_id = event_data.get("app_user_id")
    product_id = event_data.get("product_id")

    logger.info(f"Subscription expired: user={app_user_id}, product={product_id}")

    # User loses access to subscription features
    # Their remaining credits stay, but they won't get more


def handle_non_renewing_purchase(event_data: Dict[str, Any], db: Session) -> None:
    """
    Handle NON_RENEWING_PURCHASE event

    Triggered when a user purchases a consumable (credit bundle).
    This is what we'll use for one-time credit purchases.
    """
    app_user_id = event_data.get("app_user_id")
    product_id = event_data.get("product_id")
    email = event_data.get("subscriber_attributes", {}).get("$email", {}).get("value")

    logger.info(f"Non-renewing purchase: user={app_user_id}, product={product_id}")

    # Get or create user
    user = get_or_create_user(app_user_id, email, db)
    credit = get_or_create_credit(user.id, db)

    # Add credits based on product purchased
    credits_to_add = get_credits_for_product(product_id)

    if credits_to_add > 0:
        credit.balance += credits_to_add
        db.commit()
        logger.info(
            f"Added {credits_to_add} credits to user {app_user_id} (new balance: {credit.balance})"
        )


def get_credits_for_product(product_id: str) -> int:
    """
    Map product IDs to credit amounts

    Product IDs should match what you configure in App Store Connect and RevenueCat.

    Example product IDs:
    - com.lusterai.trial: 10 credits
    - com.lusterai.pro.monthly: 45 credits
    - com.lusterai.credits.small: 5 credits
    - com.lusterai.credits.medium: 15 credits
    - com.lusterai.credits.large: 30 credits
    """

    # Map product IDs to credits
    credit_map = {
        # Subscriptions
        "com.lusterai.trial": 10,
        "com.lusterai.pro.monthly": 45,
        "com.lusterai.pro.yearly": 540,  # 45 * 12 if you add yearly
        # One-time credit bundles
        "com.lusterai.credits.small": 5,
        "com.lusterai.credits.medium": 15,
        "com.lusterai.credits.large": 30,
    }

    credits = credit_map.get(product_id, 0)

    if credits == 0:
        logger.warning(f"Unknown product ID: {product_id}")

    return credits


@router.post("")
async def revenuecat_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Handle RevenueCat webhook events

    RevenueCat will POST to this endpoint when events occur:
    - INITIAL_PURCHASE: First time purchase
    - RENEWAL: Subscription renewed
    - CANCELLATION: Subscription cancelled
    - NON_RENEWING_PURCHASE: One-time purchase (credit bundles)
    - EXPIRATION: Subscription expired
    - And many more...

    See: https://www.revenuecat.com/docs/webhooks
    """
    import json

    # Read raw body first (needed for signature verification)
    raw_body = await request.body()

    # Verify webhook signature (CRITICAL: prevents forged webhooks)
    if not await verify_webhook_signature(request, raw_body):
        logger.warning("Webhook signature verification failed - rejecting")
        raise HTTPException(status_code=401, detail="Invalid signature")

    # Parse webhook body
    try:
        body = json.loads(raw_body)
    except Exception as e:
        logger.error(f"Failed to parse webhook body: {e}")
        raise HTTPException(status_code=400, detail="Invalid JSON")

    event_type = body.get("event", {}).get("type")
    event_data = body.get("event", {})

    logger.info(f"Received RevenueCat webhook: {event_type}")

    # Handle different event types
    try:
        if event_type == "INITIAL_PURCHASE":
            handle_initial_purchase(event_data, db)

        elif event_type == "RENEWAL":
            handle_renewal(event_data, db)

        elif event_type == "CANCELLATION":
            handle_cancellation(event_data, db)

        elif event_type == "EXPIRATION":
            handle_expiration(event_data, db)

        elif event_type == "NON_RENEWING_PURCHASE":
            handle_non_renewing_purchase(event_data, db)

        else:
            logger.info(f"Unhandled event type: {event_type}")

    except Exception as e:
        logger.error(f"Error handling webhook event {event_type}: {e}")
        # Don't raise HTTP exception - we want to return 200 to RevenueCat
        # Otherwise they'll keep retrying

    return {"status": "ok"}


@router.get("/test")
def test_webhook():
    """Test endpoint to verify webhook is accessible"""
    return {
        "status": "ok",
        "message": "RevenueCat webhook endpoint is accessible",
        "webhook_secret_configured": bool(REVENUECAT_WEBHOOK_SECRET),
    }
