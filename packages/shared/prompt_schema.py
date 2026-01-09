"""
Structured prompt schema for GPT-Image best practices.

Based on research showing GPT-Image models respond best to:
1. Clear instructional header at the top
2. Ordered blocks: Scene -> Constraints -> Camera -> Lighting -> Avoid
3. Positive + Negative lists separated explicitly
4. Specific technical cues (focal length, color temp, angles)
5. Structured format with labeled sections
"""

from dataclasses import dataclass, field, asdict
from typing import Optional
import json


@dataclass
class CameraSpec:
    """Camera and perspective specifications."""
    height: str = "40-48 inches (eye level)"
    focal_length: str = "24-28mm wide-angle equivalent"
    perspective: str = "natural, minimal barrel distortion"

    def to_text(self) -> str:
        return f"""- Height: {self.height}
- Focal length: {self.focal_length}
- Perspective: {self.perspective}"""


@dataclass
class LightingSpec:
    """Lighting and color specifications."""
    color_temp: str = "5200K neutral daylight white balance"
    exposure: str = "+0.2-0.3 EV lift on walls and ceilings"
    balance: str = "bright, clean, even illumination"
    shadows: str = "soft, natural shadow roll-off"

    def to_text(self) -> str:
        return f"""- Color temperature: {self.color_temp}
- Exposure: {self.exposure}
- Balance: {self.balance}
- Shadows: {self.shadows}"""


@dataclass
class EnhancementPrompt:
    """
    Structured prompt for real estate image enhancement.

    Follows GPT-Image best practices:
    - Instruction first (task clarity)
    - Scene description (context)
    - Must preserve (positive constraints)
    - May remove (allowed edits)
    - Camera specs (technical cues)
    - Lighting specs (technical cues)
    - Output constraints (quality rules)
    - Avoid (negative constraints)
    """

    # Core instruction - what to do
    instruction: str = "Edit this real estate photograph to professional MLS listing quality."

    # Scene context
    scene: str = "Interior/exterior property photograph"

    # Positive constraints - what to keep
    must_preserve: list = field(default_factory=lambda: [
        "All architectural features (doors, windows, moldings, trim)",
        "Cabinet hardware (knobs, handles, pulls) - immutable",
        "Material textures (wood grain, stone, tile, fabric)",
        "Furniture positions and scale",
        "Room layout and spatial relationships",
        "Wall colors and paint finishes",
        "Fixed appliances and built-ins",
    ])

    # Allowed removals
    may_remove: list = field(default_factory=lambda: [
        "Cables, chargers, cords, wires",
        "Papers, mail, documents, magazines",
        "Toiletries and personal care items",
        "Food, dishes, open containers",
        "Pet items (bowls, beds, toys)",
        "Clothing, shoes, bags on floors",
        "Visible trash or clutter",
    ])

    # Camera specifications
    camera: CameraSpec = field(default_factory=CameraSpec)

    # Lighting specifications
    lighting: LightingSpec = field(default_factory=LightingSpec)

    # Output quality constraints
    output_constraints: list = field(default_factory=lambda: [
        "No invented objects or furniture",
        "No added architectural features",
        "All screens (TV, monitors, phones) must be OFF or black",
        "No hidden or deceptive edits",
        "Room must remain recognizably the same",
        "Photorealistic output only",
    ])

    # Negative constraints - what to avoid
    avoid: list = field(default_factory=lambda: [
        "Adding people or animals",
        "Removing permanent fixtures or built-ins",
        "Changing wall colors or paint",
        "Altering room dimensions or layout",
        "Over-saturated or HDR look",
        "Artificial or unnatural lighting effects",
        "Fantasy elements or unrealistic staging",
    ])

    # Style-specific modifiers (optional)
    style_name: str = "default"
    style_modifiers: dict = field(default_factory=dict)

    def to_structured_text(self) -> str:
        """
        Convert to structured text format for GPT-Image.

        Format follows best practices:
        - Labeled sections
        - Bullet points for lists
        - Clear separation between positive/negative
        """
        sections = []

        # Instruction (task clarity at top)
        sections.append(f"Instruction:\n{self.instruction}")

        # Scene context
        sections.append(f"Scene:\n{self.scene}")

        # Must Preserve (positive constraints)
        preserve_items = "\n".join(f"- {item}" for item in self.must_preserve)
        sections.append(f"Must Preserve:\n{preserve_items}")

        # May Remove (allowed edits)
        remove_items = "\n".join(f"- {item}" for item in self.may_remove)
        sections.append(f"May Remove:\n{remove_items}")

        # Camera specifications
        sections.append(f"Camera:\n{self.camera.to_text()}")

        # Lighting specifications
        sections.append(f"Lighting:\n{self.lighting.to_text()}")

        # Output constraints
        constraint_items = "\n".join(f"- {item}" for item in self.output_constraints)
        sections.append(f"Output Constraints:\n{constraint_items}")

        # Avoid (negative constraints)
        avoid_items = "\n".join(f"- {item}" for item in self.avoid)
        sections.append(f"Avoid:\n{avoid_items}")

        # Style modifiers if present
        if self.style_modifiers:
            modifier_text = "\n".join(f"- {k}: {v}" for k, v in self.style_modifiers.items())
            sections.append(f"Style Adjustments:\n{modifier_text}")

        return "\n\n".join(sections)

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON storage."""
        return {
            "instruction": self.instruction,
            "scene": self.scene,
            "must_preserve": self.must_preserve,
            "may_remove": self.may_remove,
            "camera": asdict(self.camera),
            "lighting": asdict(self.lighting),
            "output_constraints": self.output_constraints,
            "avoid": self.avoid,
            "style_name": self.style_name,
            "style_modifiers": self.style_modifiers,
        }

    def to_json(self) -> str:
        """Convert to JSON string for database storage."""
        return json.dumps(self.to_dict(), indent=2)

    @classmethod
    def from_dict(cls, data: dict) -> 'EnhancementPrompt':
        """Create from dictionary (for loading from database)."""
        camera_data = data.get("camera", {})
        lighting_data = data.get("lighting", {})

        return cls(
            instruction=data.get("instruction", cls.instruction),
            scene=data.get("scene", cls.scene),
            must_preserve=data.get("must_preserve", []),
            may_remove=data.get("may_remove", []),
            camera=CameraSpec(**camera_data) if camera_data else CameraSpec(),
            lighting=LightingSpec(**lighting_data) if lighting_data else LightingSpec(),
            output_constraints=data.get("output_constraints", []),
            avoid=data.get("avoid", []),
            style_name=data.get("style_name", "default"),
            style_modifiers=data.get("style_modifiers", {}),
        )

    @classmethod
    def from_json(cls, json_str: str) -> 'EnhancementPrompt':
        """Create from JSON string."""
        return cls.from_dict(json.loads(json_str))


# Convenience function for quick prompt generation
def create_prompt(
    style: str = "default",
    scene: str = None,
    room_type: str = None,
) -> EnhancementPrompt:
    """
    Create an EnhancementPrompt with sensible defaults.

    Args:
        style: Style preset name (default, bright_airy, dusk, etc.)
        scene: Optional scene description override
        room_type: Optional room type for context

    Returns:
        EnhancementPrompt configured for the style
    """
    from .prompt_builder import PromptBuilder

    builder = PromptBuilder(style)
    if room_type:
        builder = builder.with_room_type(room_type)

    return builder.build()
