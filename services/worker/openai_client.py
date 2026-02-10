#!/usr/bin/env python3

import base64
import logging
import os
import time
from typing import Any, Dict, Optional

import requests
from dotenv import load_dotenv
from openai import OpenAI
from PIL import Image

load_dotenv()

logger = logging.getLogger(__name__)


class LusterOpenAIClient:
    """OpenAI client for Luster AI real estate photo enhancement.

    Prompts are built and merged at the API layer (via prompt_loader)
    and stored in the job row. This client receives the final prompt
    and sends it to OpenAI — no prompt assembly here.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.client = OpenAI(api_key=api_key or os.getenv("OPENAI_API_KEY"))

    def enhance_image(
        self,
        image_path: str,
        prompt: str,
        size: str = "1536x1024",
        quality: str = "high",
        max_retries: int = 3,
    ) -> Dict[str, Any]:
        """
        Enhance a real estate photo using OpenAI's image editing API.

        Args:
            image_path: Path to the input image.
            prompt: The full, pre-merged prompt (default + style).
            size: Output image size.
            quality: Image quality setting.
            max_retries: Maximum retry attempts.

        Returns:
            Dict containing success status, image_data, and metadata.
        """
        try:
            if not os.path.exists(image_path):
                raise FileNotFoundError(f"Image not found: {image_path}")

            logger.info(f"Enhancing image: {image_path}")

            for attempt in range(max_retries):
                try:
                    with open(image_path, "rb") as image_file:
                        response = self.client.images.edit(
                            model="gpt-image-1",
                            image=image_file,
                            prompt=prompt,
                            size=size,
                            quality=quality,
                            n=1,
                        )

                    if response.data and len(response.data) > 0:
                        image_data = None

                        if (
                            hasattr(response.data[0], "b64_json")
                            and response.data[0].b64_json
                        ):
                            image_data = base64.b64decode(response.data[0].b64_json)
                        elif hasattr(response.data[0], "url") and response.data[0].url:
                            img_response = requests.get(response.data[0].url)
                            img_response.raise_for_status()
                            image_data = img_response.content
                        else:
                            raise Exception("No valid image data in response")

                        image_data = self._strip_exif_data(image_data)

                        return {
                            "success": True,
                            "image_data": image_data,
                            "size": size,
                            "quality": quality,
                            "prompt_used": (
                                prompt[:200] + "..."
                                if len(prompt) > 200
                                else prompt
                            ),
                        }
                    else:
                        raise Exception("Empty response from OpenAI API")

                except Exception as e:
                    logger.warning(f"Attempt {attempt + 1} failed: {e}")
                    if attempt == max_retries - 1:
                        raise
                    time.sleep(2**attempt)

        except Exception as e:
            logger.error(f"Failed to enhance image: {e}")
            return {
                "success": False,
                "error": str(e),
            }

    def _strip_exif_data(self, image_data: bytes) -> bytes:
        """Remove EXIF data from image for privacy."""
        try:
            from io import BytesIO

            image = Image.open(BytesIO(image_data))

            if image.format != "JPEG":
                return image_data

            if hasattr(image, "_getexif"):
                if image.mode in ("RGBA", "LA", "P"):
                    rgb_image = Image.new("RGB", image.size, (255, 255, 255))
                    if image.mode == "P":
                        image = image.convert("RGBA")
                    rgb_image.paste(
                        image,
                        mask=(
                            image.split()[-1] if image.mode in ("RGBA", "LA") else None
                        ),
                    )
                    image = rgb_image

                output = BytesIO()
                image.save(output, format="JPEG", quality=95)
                return output.getvalue()
            else:
                return image_data

        except Exception as e:
            logger.warning(f"Failed to strip EXIF data: {e}")
            return image_data

    def validate_image_file(
        self, file_path: str, max_size_mb: int = 10
    ) -> Dict[str, Any]:
        """Validate image file for processing."""
        try:
            if not os.path.exists(file_path):
                return {"valid": False, "error": "File does not exist"}

            if not os.path.isfile(file_path):
                return {"valid": False, "error": "Path is not a file"}

            if not os.access(file_path, os.R_OK):
                return {"valid": False, "error": "File is not readable"}

            file_size = os.path.getsize(file_path)

            if file_size == 0:
                return {"valid": False, "error": "File is empty (0 bytes)"}

            if file_size > max_size_mb * 1024 * 1024:
                return {"valid": False, "error": f"File too large (max {max_size_mb}MB)"}

            with Image.open(file_path) as img:
                width, height = img.size
                fmt = img.format
                mode = img.mode

            supported_formats = ["JPEG", "JPG", "PNG", "WEBP"]
            if fmt not in supported_formats:
                return {"valid": False, "error": f"Unsupported format: {fmt}"}

            return {
                "valid": True,
                "file_size": file_size,
                "dimensions": (width, height),
                "format": fmt,
                "mode": mode,
            }

        except Exception as e:
            logger.error(f"Validation error: {e}")
            return {"valid": False, "error": str(e)}
