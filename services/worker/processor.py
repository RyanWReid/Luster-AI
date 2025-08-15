# Enhanced image processing using Luster AI's OpenAI client
import os
import sys
import json
import logging
from pathlib import Path
from typing import Optional, Dict, Any

# Add the parent directory to the path to import from api
sys.path.append(str(Path(__file__).parent.parent / 'api'))
from openai_client import LusterOpenAIClient

logger = logging.getLogger(__name__)

class ImageProcessor:
    def __init__(self, api_key: str):
        self.openai_client = LusterOpenAIClient(api_key=api_key)
        logger.info("ImageProcessor initialized with Luster OpenAI client")
    
    def process_image(
        self, 
        input_path: str, 
        prompt: str, 
        output_path: str,
        style_preset: str = "default",
        room_type: Optional[str] = None,
        tier: str = "premium"
    ) -> Dict[str, Any]:
        """
        Process an image using OpenAI's gpt-image-1 model with Luster AI enhancements
        
        Args:
            input_path: Path to input image
            prompt: Processing prompt (can be used as custom_prompt)
            output_path: Path where output should be saved
            style_preset: Style preset to apply
            room_type: Room type for specific enhancements
            
        Returns:
            Dict with processing results
        """
        try:
            print(f"\n--- IMAGE PROCESSOR DEBUG ---")
            print(f"Input path: {input_path}")
            print(f"Prompt: {prompt}")
            print(f"Output path: {output_path}")
            print(f"Style preset: {style_preset}")
            print(f"Room type: {room_type}")
            print(f"Tier: {tier}")
            
            logger.info(f"Processing image: {input_path}")
            logger.info(f"Style preset: {style_preset}, Room type: {room_type}")
            logger.info(f"Custom prompt: {prompt[:100]}..." if len(prompt) > 100 else f"Custom prompt: {prompt}")
            
            # Check if input file exists and is readable
            if not os.path.exists(input_path):
                error_msg = f"Input file does not exist: {input_path}"
                print(f"ERROR: {error_msg}")
                logger.error(error_msg)
                return {"success": False, "error": error_msg}
            
            if not os.path.isfile(input_path):
                error_msg = f"Input path is not a file: {input_path}"
                print(f"ERROR: {error_msg}")
                logger.error(error_msg)
                return {"success": False, "error": error_msg}
            
            if not os.access(input_path, os.R_OK):
                error_msg = f"Input file is not readable: {input_path}"
                print(f"ERROR: {error_msg}")
                logger.error(error_msg)
                return {"success": False, "error": error_msg}
            
            # Get file stats
            file_stat = os.stat(input_path)
            print(f"File stats:")
            print(f"  - Size: {file_stat.st_size} bytes")
            print(f"  - Mode: {oct(file_stat.st_mode)}")
            print(f"  - Readable: {os.access(input_path, os.R_OK)}")
            
            # Validate input image with detailed debugging
            print(f"Validating image file...")
            validation_result = self.openai_client.validate_image_file(input_path)
            print(f"Validation result: {validation_result}")
            
            if not validation_result["valid"]:
                error_msg = f"Invalid input image: {validation_result['error']}"
                print(f"ERROR: {error_msg}")
                logger.error(error_msg)
                return {"success": False, "error": error_msg}
            
            # Parse style preset from prompt if it contains style information
            # Look for common style indicators in the prompt
            detected_style = self._detect_style_from_prompt(prompt)
            if detected_style:
                style_preset = detected_style
                logger.info(f"Detected style from prompt: {style_preset}")
            
            # Set tier-specific settings
            if tier == "free":
                size = "1024x1024"  # Smaller size for free tier
                quality = "low"  # Lower quality for free tier
            else:
                size = "1536x1024"  # Higher resolution for premium
                quality = "high"  # High quality for premium (was "hd")
            
            # Process the image
            result = self.openai_client.enhance_image(
                image_path=input_path,
                style_preset=style_preset,
                room_type=room_type,
                custom_prompt=prompt,
                size=size,
                quality=quality
            )
            
            if result["success"]:
                # Save the processed image
                os.makedirs(os.path.dirname(output_path), exist_ok=True)
                
                with open(output_path, "wb") as f:
                    f.write(result["image_data"])
                
                logger.info(f"Image processed successfully: {output_path}")
                
                return {
                    "success": True,
                    "output_path": output_path,
                    "style_preset": result["style_preset"],
                    "room_type": result["room_type"],
                    "file_size": len(result["image_data"]),
                    "prompt_used": result["prompt_used"]
                }
            else:
                error_msg = f"OpenAI processing failed: {result['error']}"
                logger.error(error_msg)
                return {"success": False, "error": error_msg}
                
        except Exception as e:
            error_msg = f"Error processing image: {str(e)}"
            logger.error(error_msg)
            return {"success": False, "error": error_msg}
    
    def _detect_style_from_prompt(self, prompt: str) -> Optional[str]:
        """Detect style preset from prompt content"""
        prompt_lower = prompt.lower()
        
        # Style detection patterns
        style_patterns = {
            "bright_airy": ["bright", "airy", "white", "crisp", "clean white"],
            "dusk": ["dusk", "evening", "golden hour", "warm lighting", "sunset"],
            "sky_replacement": ["sky", "blue sky", "clear sky", "weather"],
            "lawn_cleanup": ["lawn", "grass", "landscaping", "garden", "yard"]
        }
        
        for style, patterns in style_patterns.items():
            if any(pattern in prompt_lower for pattern in patterns):
                return style
        
        return None
    
    def validate_image(self, file_path: str) -> bool:
        """Validate that the file is a valid image"""
        validation_result = self.openai_client.validate_image_file(file_path)
        return validation_result["valid"]
    
    def get_available_styles(self) -> Dict[str, str]:
        """Get available style presets"""
        return self.openai_client.get_available_styles()
    
    def get_available_room_types(self) -> Dict[str, str]:
        """Get available room types"""
        return self.openai_client.get_available_room_types()
    
    def get_processing_info(self, input_path: str) -> Dict[str, Any]:
        """Get information about image processing capabilities"""
        validation = self.openai_client.validate_image_file(input_path)
        
        return {
            "validation": validation,
            "available_styles": self.get_available_styles(),
            "available_room_types": self.get_available_room_types(),
            "default_settings": {
                "size": "1536x1024",
                "quality": "high",
                "style_preset": "default"
            }
        }