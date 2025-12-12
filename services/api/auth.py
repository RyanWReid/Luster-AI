"""
Supabase Authentication Module

Handles JWT verification using JWKS from Supabase, caching public keys,
and providing FastAPI dependencies for authenticated endpoints.
"""

import os
import time
from typing import Dict, Optional

import jwt
import requests
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from database import Credit, User, get_db
from logger import logger

load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_JWKS_URL = os.getenv("SUPABASE_JWKS_URL")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

# If JWKS URL not set, construct from Supabase URL
if not SUPABASE_JWKS_URL and SUPABASE_URL:
    SUPABASE_JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"

# JWT configuration - use HS256 if JWT secret provided, otherwise RS256 with JWKS
JWT_ALGORITHM = "HS256" if SUPABASE_JWT_SECRET else "RS256"
JWT_AUDIENCE = "authenticated"  # Supabase default audience

# Cache configuration
JWKS_CACHE_TTL = 3600  # 1 hour cache for JWKS
_jwks_cache: Optional[Dict] = None
_jwks_cache_time: float = 0


class AuthenticationError(Exception):
    """Custom authentication error"""

    pass


def get_jwks() -> Dict:
    """
    Fetch JWKS (JSON Web Key Set) from Supabase with caching.

    Returns:
        Dict containing the JWKS

    Raises:
        AuthenticationError: If JWKS cannot be fetched
    """
    global _jwks_cache, _jwks_cache_time

    current_time = time.time()

    # Return cached JWKS if still valid
    if _jwks_cache and (current_time - _jwks_cache_time) < JWKS_CACHE_TTL:
        return _jwks_cache

    # Fetch fresh JWKS
    if not SUPABASE_JWKS_URL:
        raise AuthenticationError("SUPABASE_JWKS_URL not configured")

    try:
        logger.info(f"Fetching JWKS from {SUPABASE_JWKS_URL}")
        response = requests.get(SUPABASE_JWKS_URL, timeout=10)
        response.raise_for_status()

        jwks = response.json()

        # Update cache
        _jwks_cache = jwks
        _jwks_cache_time = current_time

        logger.info("JWKS cache updated successfully")
        return jwks

    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to fetch JWKS: {e}")

        # Return stale cache if available
        if _jwks_cache:
            logger.warning("Using stale JWKS cache due to fetch failure")
            return _jwks_cache

        raise AuthenticationError(f"Failed to fetch JWKS: {str(e)}")


def get_public_key_from_jwks(token: str, jwks: Dict) -> str:
    """
    Extract the public key from JWKS based on token's kid (key ID).

    Args:
        token: JWT token string
        jwks: JWKS dictionary

    Returns:
        Public key string in PEM format

    Raises:
        AuthenticationError: If key cannot be found
    """
    try:
        # Decode token header without verification to get kid
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")

        if not kid:
            raise AuthenticationError("Token missing 'kid' in header")

        # Find matching key in JWKS
        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                # Convert JWK to PEM format
                from jwt.algorithms import RSAAlgorithm

                public_key = RSAAlgorithm.from_jwk(key)
                return public_key

        raise AuthenticationError(f"Public key not found for kid: {kid}")

    except jwt.exceptions.DecodeError as e:
        raise AuthenticationError(f"Invalid token format: {str(e)}")


def verify_jwt_token(token: str) -> Dict:
    """
    Verify JWT token from Supabase and extract claims.

    Args:
        token: JWT token string

    Returns:
        Dictionary of token claims (user_id, email, etc.)

    Raises:
        AuthenticationError: If token is invalid
    """
    global _jwks_cache, _jwks_cache_time

    try:
        # Determine verification key based on configuration
        if SUPABASE_JWT_SECRET:
            # Use symmetric HS256 verification with JWT secret
            verification_key = SUPABASE_JWT_SECRET
            logger.debug("Using HS256 with JWT secret for verification")
        else:
            # Use asymmetric RS256 verification with JWKS
            jwks = get_jwks()
            try:
                verification_key = get_public_key_from_jwks(token, jwks)
            except AuthenticationError as e:
                # If kid not found, force refresh JWKS cache and retry once
                if "Public key not found for kid" in str(e):
                    logger.info("Kid not found in cache, forcing JWKS refresh")
                    _jwks_cache = None
                    _jwks_cache_time = 0
                    jwks = get_jwks()
                    verification_key = get_public_key_from_jwks(token, jwks)
                else:
                    raise

        # Verify and decode token
        payload = jwt.decode(
            token,
            verification_key,
            algorithms=[JWT_ALGORITHM],
            audience=JWT_AUDIENCE,
            options={
                "verify_signature": True,
                "verify_exp": True,  # Verify expiration
                "verify_aud": True,  # Verify audience
            },
        )

        # Extract user info
        user_id = payload.get("sub")  # 'sub' is the user ID in JWT
        email = payload.get("email")

        if not user_id:
            raise AuthenticationError("Token missing 'sub' claim")

        logger.info(f"Successfully verified token for user {user_id}")

        return {
            "user_id": user_id,
            "email": email,
            "payload": payload,
        }

    except jwt.exceptions.ExpiredSignatureError:
        raise AuthenticationError("Token has expired")
    except jwt.exceptions.InvalidAudienceError:
        raise AuthenticationError("Invalid token audience")
    except jwt.exceptions.InvalidTokenError as e:
        raise AuthenticationError(f"Invalid token: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error verifying token: {e}")
        raise AuthenticationError(f"Token verification failed: {str(e)}")


def get_or_create_user(user_id: str, email: Optional[str], db: Session) -> User:
    """
    Get existing user or create new one with default credits.

    Args:
        user_id: User ID from JWT
        email: User email from JWT
        db: Database session

    Returns:
        User object
    """
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()

    if user:
        logger.info(f"Existing user found: {user_id}")
        return user

    # Create new user
    logger.info(f"Creating new user: {user_id} ({email})")

    user = User(
        id=user_id,
        email=email or f"{user_id}@luster.app",  # Fallback email
    )
    db.add(user)
    db.flush()

    # Create credit record with 0 balance
    credit = Credit(
        user_id=user_id,
        balance=0,
    )
    db.add(credit)
    db.commit()
    db.refresh(user)

    logger.info(f"New user created with 0 credits: {user_id}")

    return user


# FastAPI security scheme
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    FastAPI dependency to get the current authenticated user.

    This function:
    1. Extracts JWT token from Authorization header
    2. Verifies the token using Supabase JWKS
    3. Gets or creates user in our database
    4. Returns User object

    Usage in endpoints:
        @app.get("/protected")
        def protected_route(user: User = Depends(get_current_user)):
            return {"user_id": user.id}

    Args:
        credentials: HTTP Authorization credentials (Bearer token)
        db: Database session

    Returns:
        User object

    Raises:
        HTTPException: 401 if authentication fails
    """
    # Check if credentials provided
    if not credentials:
        logger.warning("No authorization credentials provided")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    try:
        # Verify JWT token
        token_data = verify_jwt_token(token)

        # Get or create user
        user = get_or_create_user(
            user_id=token_data["user_id"],
            email=token_data.get("email"),
            db=db,
        )

        return user

    except AuthenticationError as e:
        logger.warning(f"Authentication failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Unexpected error in authentication: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication service error",
        )


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """
    FastAPI dependency for optional authentication.

    Returns User if valid token provided, None otherwise.
    Does not raise exception if token missing or invalid.

    Usage:
        @app.get("/public-or-private")
        def route(user: Optional[User] = Depends(get_optional_user)):
            if user:
                return {"authenticated": True, "user_id": user.id}
            return {"authenticated": False}
    """
    if not credentials:
        return None

    try:
        token_data = verify_jwt_token(credentials.credentials)
        user = get_or_create_user(
            user_id=token_data["user_id"],
            email=token_data.get("email"),
            db=db,
        )
        return user
    except (AuthenticationError, Exception) as e:
        logger.debug(f"Optional auth failed: {e}")
        return None


def get_user_id_from_token(token: str) -> str:
    """
    Extract user ID from token without full verification.
    Useful for logging or analytics where security isn't critical.

    Args:
        token: JWT token string

    Returns:
        User ID string

    Raises:
        ValueError: If token cannot be decoded
    """
    try:
        # Decode without verification
        payload = jwt.decode(token, options={"verify_signature": False})
        return payload.get("sub", "unknown")
    except Exception:
        return "invalid"
