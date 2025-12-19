#!/usr/bin/env python3

import logging
import os
from typing import Dict, Optional

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class R2Client:
    """Cloudflare R2 storage client using S3-compatible API"""

    def __init__(
        self,
        account_id: Optional[str] = None,
        access_key_id: Optional[str] = None,
        secret_access_key: Optional[str] = None,
        bucket_name: Optional[str] = None,
    ):
        """
        Initialize R2 client

        Args:
            account_id: Cloudflare account ID
            access_key_id: R2 access key ID
            secret_access_key: R2 secret access key
            bucket_name: R2 bucket name
        """
        # Support both R2_* and S3_* env var naming conventions
        self.access_key_id = access_key_id or os.getenv("S3_ACCESS_KEY_ID") or os.getenv("R2_ACCESS_KEY_ID")
        self.secret_access_key = secret_access_key or os.getenv("S3_SECRET_ACCESS_KEY") or os.getenv("R2_SECRET_ACCESS_KEY")
        self.bucket_name = bucket_name or os.getenv("S3_BUCKET") or os.getenv("R2_BUCKET_NAME", "luster")

        # Get endpoint URL directly or construct from account ID
        self.endpoint_url = os.getenv("S3_ENDPOINT")
        if not self.endpoint_url:
            self.account_id = account_id or os.getenv("R2_ACCOUNT_ID")
            if self.account_id:
                self.endpoint_url = f"https://{self.account_id}.r2.cloudflarestorage.com"

        # Validate required credentials
        if not self.endpoint_url:
            raise ValueError("S3_ENDPOINT or R2_ACCOUNT_ID is required")
        if not self.access_key_id:
            raise ValueError("S3_ACCESS_KEY_ID or R2_ACCESS_KEY_ID is required")
        if not self.secret_access_key:
            raise ValueError("S3_SECRET_ACCESS_KEY or R2_SECRET_ACCESS_KEY is required")

        # Configure boto3 S3 client for R2
        self.s3_client = boto3.client(
            "s3",
            endpoint_url=self.endpoint_url,
            aws_access_key_id=self.access_key_id,
            aws_secret_access_key=self.secret_access_key,
            region_name="auto",  # R2 uses 'auto' region
            config=Config(
                signature_version="s3v4",
                s3={"addressing_style": "path"},
            ),
        )

        logger.info(f"R2Client initialized for bucket: {self.bucket_name}")

    def generate_presigned_upload_url(
        self,
        object_key: str,
        content_type: str = "image/jpeg",
        expiration: int = 3600,
        max_file_size: int = 10 * 1024 * 1024,  # 10MB default
    ) -> Dict[str, str]:
        """
        Generate presigned POST URL for direct client uploads

        Args:
            object_key: S3 object key (file path in bucket)
            content_type: MIME type of the file
            expiration: URL expiration time in seconds
            max_file_size: Maximum file size in bytes

        Returns:
            Dict with 'url' and 'fields' for multipart form upload
        """
        try:
            # Conditions for the upload
            conditions = [
                {"bucket": self.bucket_name},
                {"key": object_key},
                {"Content-Type": content_type},
                ["content-length-range", 1, max_file_size],
            ]

            # Generate presigned POST
            presigned_post = self.s3_client.generate_presigned_post(
                Bucket=self.bucket_name,
                Key=object_key,
                Fields={"Content-Type": content_type},
                Conditions=conditions,
                ExpiresIn=expiration,
            )

            logger.info(f"Generated presigned upload URL for: {object_key}")
            return presigned_post

        except ClientError as e:
            logger.error(f"Failed to generate presigned upload URL: {e}")
            raise

    def generate_presigned_download_url(
        self,
        object_key: str,
        expiration: int = 3600,
        filename: Optional[str] = None,
    ) -> str:
        """
        Generate presigned GET URL for downloads

        Args:
            object_key: S3 object key (file path in bucket)
            expiration: URL expiration time in seconds
            filename: Optional filename for Content-Disposition header

        Returns:
            Presigned URL string
        """
        try:
            params = {
                "Bucket": self.bucket_name,
                "Key": object_key,
            }

            # Add Content-Disposition header if filename provided
            if filename:
                params["ResponseContentDisposition"] = (
                    f'attachment; filename="{filename}"'
                )

            url = self.s3_client.generate_presigned_url(
                "get_object",
                Params=params,
                ExpiresIn=expiration,
            )

            logger.info(f"Generated presigned download URL for: {object_key}")
            return url

        except ClientError as e:
            logger.error(f"Failed to generate presigned download URL: {e}")
            raise

    def upload_file(
        self,
        file_path: str,
        object_key: str,
        content_type: Optional[str] = None,
        metadata: Optional[Dict[str, str]] = None,
    ) -> str:
        """
        Upload a file directly to R2 (used by worker service)

        Args:
            file_path: Local file path to upload
            object_key: S3 object key (destination path in bucket)
            content_type: MIME type of the file
            metadata: Optional metadata dict

        Returns:
            Object key of uploaded file
        """
        try:
            extra_args = {}
            if content_type:
                extra_args["ContentType"] = content_type
            if metadata:
                extra_args["Metadata"] = metadata

            self.s3_client.upload_file(
                file_path,
                self.bucket_name,
                object_key,
                ExtraArgs=extra_args if extra_args else None,
            )

            logger.info(f"Uploaded file to R2: {object_key}")
            return object_key

        except ClientError as e:
            logger.error(f"Failed to upload file to R2: {e}")
            raise

    def download_file(
        self,
        object_key: str,
        file_path: str,
    ) -> str:
        """
        Download a file from R2 (used by worker service)

        Args:
            object_key: S3 object key (source path in bucket)
            file_path: Local file path to save to

        Returns:
            Local file path
        """
        try:
            self.s3_client.download_file(
                self.bucket_name,
                object_key,
                file_path,
            )

            logger.info(f"Downloaded file from R2: {object_key}")
            return file_path

        except ClientError as e:
            logger.error(f"Failed to download file from R2: {e}")
            raise

    def delete_file(self, object_key: str) -> None:
        """
        Delete a file from R2

        Args:
            object_key: S3 object key to delete
        """
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=object_key,
            )

            logger.info(f"Deleted file from R2: {object_key}")

        except ClientError as e:
            logger.error(f"Failed to delete file from R2: {e}")
            raise

    def check_file_exists(self, object_key: str) -> bool:
        """
        Check if a file exists in R2

        Args:
            object_key: S3 object key to check

        Returns:
            True if file exists, False otherwise
        """
        try:
            self.s3_client.head_object(
                Bucket=self.bucket_name,
                Key=object_key,
            )
            return True
        except ClientError as e:
            if e.response["Error"]["Code"] == "404":
                return False
            logger.error(f"Error checking file existence: {e}")
            raise

    def get_file_url(self, object_key: str) -> str:
        """
        Get public URL for a file (requires bucket to be public)

        Args:
            object_key: S3 object key

        Returns:
            Public URL string
        """
        # For R2, public URLs follow this pattern if bucket is public
        # Otherwise, use presigned URLs
        return f"{self.endpoint_url}/{self.bucket_name}/{object_key}"


# Global R2 client instance
r2_client = R2Client()
