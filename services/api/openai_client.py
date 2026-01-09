#!/usr/bin/env python3

import base64
import logging
import os
import time
from pathlib import Path
from typing import Any, Dict, Optional

import requests
from dotenv import load_dotenv
from openai import OpenAI
from PIL import Image

load_dotenv()

logger = logging.getLogger(__name__)


class LusterOpenAIClient:
    """OpenAI client optimized for Luster AI real estate photo enhancement"""

    def __init__(self, api_key: Optional[str] = None):
        self.client = OpenAI(api_key=api_key or os.getenv("OPENAI_API_KEY"))

        # Set up prompts directory - relative to the OpenAI directory
        self.prompts_dir = (
            Path(__file__).parent.parent.parent
            / "OpenAI"
            / "gpt-image-enhancer"
            / "prompts"
        )

        # Style presets mapping - load from files
        self.style_presets = {
            "Default_Interior": self._load_prompt_from_file("Default_Interior"),
            "Flambient_Interior": self._load_prompt_from_file("Flambient_Interior"),
            "default": self._load_prompt_from_file("Default_Interior"),  # Alias
            "bright_airy": self._load_prompt_from_file("Flambient_Interior"),  # Alias
            "dusk": "Transform this real estate photo with warm dusk lighting, golden hour ambiance, and inviting evening atmosphere while maintaining architectural accuracy.",
            "sky_replacement": "Enhance this real estate photo with a beautiful clear blue sky, removing any overcast or gray weather while preserving all architectural details.",
            "lawn_cleanup": "Clean up and enhance the landscaping in this real estate photo, making grass greener and more manicured while keeping all hardscaping authentic.",
        }

        # Room-specific enhancements
        self.room_presets = {
            "living_room": "Focus on creating a warm, inviting living space with balanced furniture arrangement and optimal natural lighting flow.",
            "kitchen": "Emphasize clean countertops, proper under-cabinet lighting, and showcase the functionality and flow of the kitchen workspace.",
            "bedroom": "Create a serene, restful atmosphere with perfectly fluffed bedding, clean surfaces, and soft, natural lighting.",
            "bathroom": "Ensure spotless surfaces, proper mirror reflections, and clean, spa-like ambiance with neutral staging.",
            "dining_room": "Highlight the dining area's entertaining potential with balanced lighting and tasteful table presentation.",
            "home_office": "Showcase productivity and organization with clean desk surfaces and professional lighting setup.",
            "exterior": "Enhance curb appeal with natural landscaping, proper exterior lighting, and architectural details.",
        }

    def _load_prompt_from_file(self, prompt_name: str) -> str:
        """
        Load a prompt from a markdown file in the prompts directory

        Args:
            prompt_name (str): Name of the prompt file (without .md extension)

        Returns:
            str: The prompt content
        """
        try:
            prompt_file = self.prompts_dir / f"{prompt_name}.md"
            if prompt_file.exists():
                with open(prompt_file, "r", encoding="utf-8") as f:
                    content = f.read().strip()
                    logger.info(f"Loaded prompt from file: {prompt_name}")
                    return content
            else:
                # Fallback to built-in prompt if file doesn't exist
                logger.warning(f"Prompt file not found: {prompt_file}. Using fallback.")
                return self._load_default_prompt()
        except Exception as e:
            logger.error(f"Error loading prompt '{prompt_name}': {e}")
            return self._load_default_prompt()

    def _load_default_prompt(self) -> str:
        """Load the default interior prompt"""
        return """Transform this interior photo into a photorealistic, luxury-grade real estate image styled as if photographed by a top-tier editorial real estate photographer. Balance realism and artistry with natural texture, lived-in warmth, and authentic light flow. The output must remain structurally accurate, editorial in quality, and fully MLS-ready.

CORE OBJECTIVES:
• Highlight the true value of the property
• Emulate a high-end real estate magazine shoot  
• Feel authentic, clean, and timeless
• Require no manual editing
• Simulate DSLR-style wide-angle shot from eye-level height
• Preserve vertical line accuracy and true-to-life proportions

LIGHTING ENHANCEMENT:
• Clean, neutral white balance across ceilings and walls
• Controlled, realistic shadow depth
• True-to-life color tone in mixed-light scenes
• Natural daylight simulation (late morning preferred)
• Soft bounce light to avoid harsh spotlights

STAGING IMPROVEMENTS:
• Fluff pillows and bedding with natural folds
• Remove visual clutter (cords, wires, personal items)
• Clean and polish all surfaces
• Add minimal staging items only if they feel authentic

PRESERVE ARCHITECTURAL ACCURACY:
• Maintain exact cabinetry, built-ins, and fixtures
• Keep all proportions and room layout accurate
• Preserve material textures and finishes
• No artificial expansion of space

HARD LIMITS:
• No pets, people, or reflections of either
• No added furniture or major décor changes
• No misrepresentation of layout or size
• No brand names or fantasy elements"""

    def _load_bright_airy_prompt(self) -> str:
        """Load the bright airy white flambient prompt"""
        return """Transform this interior photo into a bright, airy real estate image with crisp neutral whites and professional flambient lighting. Create an editorial-quality result that feels spacious and inviting while maintaining structural accuracy.

LIGHTING SPECIFICATIONS:
• Crisp neutral white balance (≈5200K daylight)
• Whites must read bright and paper-clean
• Zero yellow/orange or blue/green color casts
• Lift ceilings and walls +0.2-0.3 EV for airy feel
• Preserve texture without blown highlights

BRIGHT-AIRY ENHANCEMENT:
• Professional HDR depth with full shadow-to-highlight detail
• Natural shadow roll-off with believable soft fill
• Recessed lighting glows without clipping
• Maintain wood warmth without cast onto whites
• Windows exposed ½-1 stop darker than interior

STAGING & CLEANUP:
• Remove all clutter (cords, papers, personal items)
• Level and straighten artwork, frames, mirrors
• Fluff pillows with natural folds and wrinkles
• Clean and polish all surfaces
• Minimal staging items only if authentic

PRESERVE ACCURACY:
• Exact cabinetry and built-in structure
• Original paint hue (no drift to pure white)
• Material qualities (matte vs gloss, fabric grain)
• Real-world proportions and layout
• Fixed architectural details

FORBIDDEN:
• No pets, people, or their reflections
• No furniture additions or major décor changes  
• No space expansion or layout changes
• No synthetic lighting effects or halos"""

    def enhance_image(
        self,
        image_path: str,
        style_preset: str = "default",
        room_type: Optional[str] = None,
        custom_prompt: str = "",
        size: str = "1536x1024",
        quality: str = "high",
        max_retries: int = 3,
    ) -> Dict[str, Any]:
        """
        Enhance a real estate photo using OpenAI's image editing API

        Args:
            image_path: Path to the input image
            style_preset: Style preset to use (default, bright_airy, dusk, etc.)
            room_type: Type of room for specific enhancements
            custom_prompt: Additional custom requirements
            size: Output image size
            quality: Image quality setting
            max_retries: Maximum number of retry attempts

        Returns:
            Dict containing success status, output_path, and metadata
        """
        try:
            # Validate input
            if not os.path.exists(image_path):
                raise FileNotFoundError(f"Image not found: {image_path}")

            # Build the prompt
            base_prompt = self.style_presets.get(
                style_preset, self.style_presets["default"]
            )
            full_prompt = base_prompt

            # Add room-specific enhancements
            if room_type and room_type in self.room_presets:
                full_prompt += (
                    f"\n\nROOM-SPECIFIC FOCUS: {self.room_presets[room_type]}"
                )

            # Add custom requirements
            if custom_prompt:
                full_prompt += f"\n\nADDITIONAL REQUIREMENTS: {custom_prompt}"

            logger.info(f"Enhancing image: {image_path} with style: {style_preset}")

            # Process image with retries
            for attempt in range(max_retries):
                try:
                    with open(image_path, "rb") as image_file:
                        response = self.client.images.edit(
                            model="gpt-image-1.5",
                            image=image_file,
                            prompt=full_prompt,
                            size=size,
                            quality=quality,
                            n=1,
                        )

                    # Handle response
                    if response.data and len(response.data) > 0:
                        image_data = None

                        # Get image data (base64 or URL)
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

                        # Strip EXIF data for privacy
                        image_data = self._strip_exif_data(image_data)

                        return {
                            "success": True,
                            "image_data": image_data,
                            "style_preset": style_preset,
                            "room_type": room_type,
                            "size": size,
                            "quality": quality,
                            "prompt_used": (
                                full_prompt[:200] + "..."
                                if len(full_prompt) > 200
                                else full_prompt
                            ),
                        }
                    else:
                        raise Exception("Empty response from OpenAI API")

                except Exception as e:
                    logger.warning(f"Attempt {attempt + 1} failed: {e}")
                    if attempt == max_retries - 1:
                        raise
                    time.sleep(2**attempt)  # Exponential backoff

        except Exception as e:
            logger.error(f"Failed to enhance image: {e}")
            return {
                "success": False,
                "error": str(e),
                "style_preset": style_preset,
                "room_type": room_type,
            }

    def _strip_exif_data(self, image_data: bytes) -> bytes:
        """Remove EXIF data from image for privacy"""
        try:
            # Load image from bytes
            from io import BytesIO

            image = Image.open(BytesIO(image_data))

            # For PNG images or images without EXIF, just return original
            # (PNG doesn't use EXIF the same way JPEG does)
            if image.format != "JPEG":
                return image_data

            # Create new image without EXIF (JPEG only)
            if hasattr(image, "_getexif"):
                # Convert RGBA to RGB if necessary (JPEG doesn't support alpha)
                if image.mode in ("RGBA", "LA", "P"):
                    # Create white background
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

                # Save without EXIF
                output = BytesIO()
                image.save(output, format="JPEG", quality=95)
                return output.getvalue()
            else:
                # No EXIF data present
                return image_data

        except Exception as e:
            logger.warning(f"Failed to strip EXIF data: {e}")
            return image_data

    def get_available_styles(self) -> Dict[str, str]:
        """Get available style presets with descriptions"""
        return {
            "default": "Professional editorial real estate photography with balanced lighting",
            "bright_airy": "Bright, airy interior with crisp whites and flambient lighting",
            "dusk": "Warm evening atmosphere with golden hour lighting",
            "sky_replacement": "Clear blue sky replacement for exterior shots",
            "lawn_cleanup": "Enhanced landscaping with manicured grass and gardens",
        }

    def get_available_room_types(self) -> Dict[str, str]:
        """Get available room types with descriptions"""
        return self.room_presets.copy()

    def validate_image_file(
        self, file_path: str, max_size_mb: int = 10
    ) -> Dict[str, Any]:
        """
        Validate image file for processing

        Args:
            file_path: Path to image file
            max_size_mb: Maximum file size in MB

        Returns:
            Dict with validation results
        """
        print(f"\n--- OPENAI CLIENT VALIDATION DEBUG ---")
        print(f"Validating file: {file_path}")
        print(f"Max size: {max_size_mb}MB")

        try:
            # Check if file exists
            if not os.path.exists(file_path):
                error_msg = "File does not exist"
                print(f"ERROR: {error_msg}")
                return {"valid": False, "error": error_msg}

            # Check if it's actually a file
            if not os.path.isfile(file_path):
                error_msg = "Path is not a file"
                print(f"ERROR: {error_msg}")
                return {"valid": False, "error": error_msg}

            # Check file permissions
            if not os.access(file_path, os.R_OK):
                error_msg = "File is not readable"
                print(f"ERROR: {error_msg}")
                return {"valid": False, "error": error_msg}

            # Check file size
            file_size = os.path.getsize(file_path)
            print(f"File size: {file_size} bytes ({file_size / 1024 / 1024:.2f} MB)")

            if file_size == 0:
                error_msg = "File is empty (0 bytes)"
                print(f"ERROR: {error_msg}")
                return {"valid": False, "error": error_msg}

            if file_size > max_size_mb * 1024 * 1024:
                error_msg = f"File too large (max {max_size_mb}MB)"
                print(f"ERROR: {error_msg}")
                return {"valid": False, "error": error_msg}

            # Try to read the first few bytes to check if it's a valid file
            try:
                with open(file_path, "rb") as f:
                    first_bytes = f.read(16)
                    print(f"First 16 bytes: {first_bytes.hex()}")
            except Exception as e:
                error_msg = f"Cannot read file: {e}"
                print(f"ERROR: {error_msg}")
                return {"valid": False, "error": error_msg}

            # Check if it's a valid image using PIL
            try:
                print("Opening image with PIL...")
                with Image.open(file_path) as img:
                    width, height = img.size
                    format = img.format
                    mode = img.mode
                    print(f"Image info: {width}x{height}, format={format}, mode={mode}")
            except Exception as e:
                error_msg = f"Invalid image file: {e}"
                print(f"ERROR: {error_msg}")
                return {"valid": False, "error": error_msg}

            # Check supported formats
            supported_formats = ["JPEG", "JPG", "PNG", "WEBP"]
            print(f"Image format: {format}")
            print(f"Supported formats: {supported_formats}")

            if format not in supported_formats:
                error_msg = f"Unsupported format: {format}"
                print(f"ERROR: {error_msg}")
                return {"valid": False, "error": error_msg}

            result = {
                "valid": True,
                "file_size": file_size,
                "dimensions": (width, height),
                "format": format,
                "mode": mode,
            }
            print(f"Validation SUCCESS: {result}")
            return result

        except Exception as e:
            error_msg = f"Validation error: {e}"
            print(f"ERROR: {error_msg}")
            logger.error(error_msg)
            return {"valid": False, "error": error_msg}
