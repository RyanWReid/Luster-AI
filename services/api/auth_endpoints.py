"""
Authentication endpoints for mobile and web clients.

These endpoints interface with Supabase Auth for:
- Magic link sign-in
- Session management
- User logout
"""
import os
from typing import Optional

import requests
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from auth import get_current_user, get_optional_user
from database import User, get_db
from logger import logger

load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

router = APIRouter(prefix="/auth", tags=["authentication"])


# Request/Response models
class MagicLinkRequest(BaseModel):
    email: EmailStr
    redirect_to: Optional[str] = None


class MagicLinkResponse(BaseModel):
    message: str
    email: str


class SessionResponse(BaseModel):
    authenticated: bool
    user_id: Optional[str] = None
    email: Optional[str] = None


class LogoutResponse(BaseModel):
    message: str


@router.post("/magic-link", response_model=MagicLinkResponse)
async def send_magic_link(request: MagicLinkRequest):
    """
    Send a magic link to user's email for passwordless sign-in.

    This endpoint calls Supabase Auth API to send a magic link email.
    The user clicks the link in their email to authenticate.

    Args:
        request: Email and optional redirect URL

    Returns:
        Success message with email

    Raises:
        HTTPException: If Supabase Auth request fails
    """
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase authentication not configured"
        )

    # Supabase Auth endpoint
    auth_url = f"{SUPABASE_URL}/auth/v1/otp"

    # Prepare request payload
    payload = {
        "email": request.email,
        "create_user": True,  # Auto-create user if doesn't exist
    }

    # Add redirect URL if provided
    if request.redirect_to:
        payload["options"] = {
            "redirect_to": request.redirect_to
        }

    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
    }

    try:
        logger.info(f"Sending magic link to {request.email}")

        response = requests.post(auth_url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()

        logger.info(f"Magic link sent successfully to {request.email}")

        return MagicLinkResponse(
            message="Magic link sent! Check your email to sign in.",
            email=request.email
        )

    except requests.exceptions.HTTPError as e:
        logger.error(f"Supabase Auth API error: {e}")
        logger.error(f"Response: {e.response.text if e.response else 'No response'}")

        # Try to extract error message from Supabase
        try:
            error_data = e.response.json() if e.response else {}
            error_message = error_data.get("msg", str(e))
        except Exception:
            error_message = str(e)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send magic link: {error_message}"
        )
    except requests.exceptions.RequestException as e:
        logger.error(f"Network error sending magic link: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable"
        )


@router.get("/session", response_model=SessionResponse)
async def get_session(
    user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """
    Check current authentication session.

    Returns user info if authenticated, otherwise indicates no session.

    This endpoint uses optional authentication, so it won't fail
    if no valid token is provided.

    Returns:
        Session info with user details if authenticated
    """
    if user:
        return SessionResponse(
            authenticated=True,
            user_id=str(user.id),
            email=user.email
        )

    return SessionResponse(authenticated=False)


@router.post("/logout", response_model=LogoutResponse)
async def logout(user: User = Depends(get_current_user)):
    """
    Logout the current user.

    This endpoint requires authentication. The actual token invalidation
    should be handled client-side by removing the token from storage.

    Server-side, Supabase tokens are stateless JWTs that expire naturally.
    For immediate invalidation, the client should discard the token.

    Note: For production, you may want to implement a token blocklist
    if immediate server-side invalidation is required.

    Returns:
        Success message
    """
    logger.info(f"User {user.id} logged out")

    return LogoutResponse(
        message="Logged out successfully. Token should be removed from client."
    )


@router.post("/refresh")
async def refresh_token():
    """
    Refresh an expired access token.

    This endpoint would typically exchange a refresh token for a new access token.
    However, for Supabase, token refresh is usually handled client-side using
    the Supabase client library.

    This is a placeholder for future implementation if needed.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Token refresh should be handled using Supabase client library"
    )


@router.get("/me")
async def get_current_user_info(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get current authenticated user's profile information.

    Requires valid JWT token in Authorization header.

    Returns:
        User profile information
    """
    from database import Credit

    # Get user's credit balance
    credit = db.query(Credit).filter(Credit.user_id == user.id).first()

    return {
        "id": str(user.id),
        "email": user.email,
        "created_at": user.created_at.isoformat(),
        "updated_at": user.updated_at.isoformat(),
        "credits": {
            "balance": credit.balance if credit else 0,
            "updated_at": credit.updated_at.isoformat() if credit and credit.updated_at else None
        }
    }


@router.post("/verify-token")
async def verify_token(user: User = Depends(get_current_user)):
    """
    Verify if the provided token is valid.

    This is useful for clients to check token validity without
    making a full API request.

    Returns:
        User ID if token is valid

    Raises:
        HTTPException: 401 if token is invalid or expired
    """
    return {
        "valid": True,
        "user_id": str(user.id),
        "email": user.email
    }
