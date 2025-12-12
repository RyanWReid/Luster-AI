"""
Pydantic schemas for API request/response validation.

This module provides:
- Input validation with descriptive error messages
- Type coercion and normalization
- UUID validation for path/query params
- Consistent response schemas
"""

from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

# =============================================================================
# Common Validators
# =============================================================================


def validate_uuid(value: str) -> str:
    """Validate that a string is a valid UUID."""
    try:
        UUID(value)
        return value
    except ValueError as e:
        raise ValueError(f"Invalid UUID format: {value}") from e


def validate_non_empty_string(value: str) -> str:
    """Validate that a string is not empty or whitespace only."""
    if not value or not value.strip():
        raise ValueError("Value cannot be empty or whitespace only")
    return value.strip()


# =============================================================================
# Shoot Schemas
# =============================================================================


class ShootCreateRequest(BaseModel):
    """Request schema for creating a new shoot."""

    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Name of the shoot/project",
        json_schema_extra={"example": "123 Main St - Living Room"},
    )

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        return validate_non_empty_string(v)


class ShootResponse(BaseModel):
    """Response schema for shoot data."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str


class ShootListResponse(BaseModel):
    """Response schema for list of shoots."""

    shoots: list[dict[str, Any]]


# =============================================================================
# Upload Schemas
# =============================================================================


class PresignedUploadRequest(BaseModel):
    """Request schema for generating presigned upload URL."""

    shoot_id: str = Field(..., description="UUID of the shoot to upload to")
    filename: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Original filename",
    )
    content_type: str = Field(
        default="image/jpeg",
        description="MIME type of the file",
        pattern=r"^image/(jpeg|jpg|png|heic|heif|webp)$",
    )
    max_file_size: int = Field(
        default=10 * 1024 * 1024,  # 10MB
        ge=1,
        le=50 * 1024 * 1024,  # 50MB max
        description="Maximum file size in bytes",
    )

    @field_validator("shoot_id")
    @classmethod
    def validate_shoot_id(cls, v: str) -> str:
        return validate_uuid(v)


class ConfirmUploadRequest(BaseModel):
    """Request schema for confirming completed upload."""

    asset_id: str = Field(..., description="UUID of the asset")
    shoot_id: str = Field(..., description="UUID of the shoot")
    object_key: str = Field(
        ...,
        min_length=1,
        max_length=1024,
        description="R2 object key",
    )
    filename: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Original filename",
    )
    file_size: int = Field(
        ...,
        ge=1,
        le=50 * 1024 * 1024,
        description="File size in bytes",
    )
    content_type: str = Field(
        default="image/jpeg",
        description="MIME type of the file",
    )

    @field_validator("asset_id", "shoot_id")
    @classmethod
    def validate_uuids(cls, v: str) -> str:
        return validate_uuid(v)


class UploadResponse(BaseModel):
    """Response schema for upload confirmation."""

    id: str
    filename: str
    size: int
    object_key: str | None = None


# =============================================================================
# Job Schemas
# =============================================================================


class JobCreateRequest(BaseModel):
    """Request schema for creating a job (Form data converted to model)."""

    asset_id: str = Field(..., description="UUID of the asset to process")
    prompt: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="Enhancement prompt",
    )
    tier: str = Field(
        default="premium",
        description="Processing tier (free or premium)",
        pattern=r"^(free|premium)$",
    )

    @field_validator("asset_id")
    @classmethod
    def validate_asset_id(cls, v: str) -> str:
        return validate_uuid(v)

    @field_validator("prompt")
    @classmethod
    def validate_prompt(cls, v: str) -> str:
        return validate_non_empty_string(v)


class JobResponse(BaseModel):
    """Response schema for job data."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    status: str
    asset_id: str
    prompt: str
    credits_used: int
    created_at: str | None = None
    updated_at: str | None = None
    started_at: str | None = None
    completed_at: str | None = None
    output_url: str | None = None
    error_message: str | None = None


class JobRefundResponse(BaseModel):
    """Response schema for job refund."""

    success: bool
    message: str
    job_id: str
    credits_refunded: int
    new_balance: int


# =============================================================================
# Mobile API Schemas
# =============================================================================


class Base64ImageRequest(BaseModel):
    """Request schema for base64 image upload."""

    image: str = Field(
        ...,
        min_length=100,  # Reasonable minimum for base64 image
        description="Base64 encoded image data",
    )
    style: str = Field(
        default="luster",
        description="Enhancement style",
        pattern=r"^(luster|flambient)$",
    )
    project_name: str | None = Field(
        default=None,
        max_length=255,
        description="Name for new project (auto-generated if not provided)",
    )
    shoot_id: str | None = Field(
        default=None,
        description="Existing shoot ID (to add photos to existing project)",
    )

    @field_validator("shoot_id")
    @classmethod
    def validate_shoot_id(cls, v: str | None) -> str | None:
        if v is not None:
            return validate_uuid(v)
        return v


class MobileEnhanceResponse(BaseModel):
    """Response schema for mobile enhance endpoint."""

    job_id: str
    status: str
    message: str
    shoot_id: str | None = None
    asset_id: str | None = None
    project_name: str | None = None


class MobilePresignRequest(BaseModel):
    """Request schema for mobile presigned upload URL."""

    filename: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Original filename",
    )
    content_type: str = Field(
        default="image/jpeg",
        description="MIME type of the file",
    )
    file_size: int = Field(
        default=10 * 1024 * 1024,
        ge=1,
        le=50 * 1024 * 1024,
        description="File size in bytes",
    )


class MobileConfirmRequest(BaseModel):
    """Request schema for mobile upload confirmation."""

    asset_id: str = Field(..., description="UUID of the asset")
    shoot_id: str = Field(..., description="UUID of the shoot")
    object_key: str = Field(
        ...,
        min_length=1,
        max_length=1024,
        description="R2 object key",
    )
    filename: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Original filename",
    )
    file_size: int = Field(
        ...,
        ge=1,
        description="File size in bytes",
    )
    content_type: str = Field(
        default="image/jpeg",
        description="MIME type of the file",
    )

    @field_validator("asset_id", "shoot_id")
    @classmethod
    def validate_uuids(cls, v: str) -> str:
        return validate_uuid(v)


# =============================================================================
# Credits Schemas
# =============================================================================


class CreditsResponse(BaseModel):
    """Response schema for credits balance."""

    balance: int
    user_id: str | None = None
    updated_at: str | None = None


# =============================================================================
# Health Check Schemas
# =============================================================================


class HealthResponse(BaseModel):
    """Response schema for health check."""

    status: str
    services: dict[str, str]


# =============================================================================
# Error Schemas (for OpenAPI documentation)
# =============================================================================


class ErrorResponse(BaseModel):
    """Standard error response schema."""

    detail: str
    error: str | None = None


class ValidationErrorResponse(BaseModel):
    """Validation error response schema (422)."""

    detail: list[dict[str, Any]]
