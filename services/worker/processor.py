"""Image processor — thin wrapper around LusterOpenAIClient.

The job's prompt field already contains the full merged prompt
(default + style), built at job creation time by prompt_loader.
This processor just validates, calls OpenAI, and writes the output.
"""

import os
import sys
import logging
from pathlib import Path
from typing import Dict, Any

sys.path.append(str(Path(__file__).parent.parent / "api"))
from openai_client import LusterOpenAIClient

logger = logging.getLogger(__name__)


class ImageProcessor:
    def __init__(self, api_key: str):
        self.openai_client = LusterOpenAIClient(api_key=api_key)
        logger.info("ImageProcessor initialized")

    def process_image(
        self,
        input_path: str,
        prompt: str,
        output_path: str,
        tier: str = "premium",
    ) -> Dict[str, Any]:
        """
        Process an image using OpenAI's gpt-image-1 model.

        Args:
            input_path: Path to input image.
            prompt: Full merged prompt (default + style) from the job row.
            output_path: Path where output should be saved.
            tier: "free" or "premium" — controls size and quality.

        Returns:
            Dict with processing results.
        """
        try:
            logger.info(f"Processing image: {input_path}")

            if not os.path.exists(input_path):
                return {"success": False, "error": f"Input file does not exist: {input_path}"}

            if not os.path.isfile(input_path):
                return {"success": False, "error": f"Input path is not a file: {input_path}"}

            # Validate input image
            validation_result = self.openai_client.validate_image_file(input_path)
            if not validation_result["valid"]:
                return {"success": False, "error": f"Invalid input image: {validation_result['error']}"}

            # Tier-specific settings
            if tier == "free":
                size = "1024x1024"
                quality = "low"
            else:
                size = "1536x1024"
                quality = "high"

            # Call OpenAI with the pre-merged prompt
            result = self.openai_client.enhance_image(
                image_path=input_path,
                prompt=prompt,
                size=size,
                quality=quality,
            )

            if result["success"]:
                os.makedirs(os.path.dirname(output_path), exist_ok=True)
                with open(output_path, "wb") as f:
                    f.write(result["image_data"])

                logger.info(f"Image processed successfully: {output_path}")

                return {
                    "success": True,
                    "output_path": output_path,
                    "file_size": len(result["image_data"]),
                    "prompt_used": result["prompt_used"],
                }
            else:
                return {"success": False, "error": f"OpenAI processing failed: {result['error']}"}

        except Exception as e:
            logger.error(f"Error processing image: {e}")
            return {"success": False, "error": str(e)}

    def validate_image(self, file_path: str) -> bool:
        """Validate that the file is a valid image."""
        return self.openai_client.validate_image_file(file_path)["valid"]
