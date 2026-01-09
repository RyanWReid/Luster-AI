"""
PromptBuilder for creating structured image enhancement prompts.

Implements GPT-Image best practices:
- Clear instructional header
- Ordered descriptive blocks
- Specific technical cues
- Explicit positive/negative lists
- Reasonable verbosity with labeled sections
"""

from copy import deepcopy
from typing import Optional
from .prompt_schema import EnhancementPrompt, CameraSpec, LightingSpec


# =============================================================================
# STYLE PRESETS - Structured Format
# =============================================================================

LUSTER_PRESET = EnhancementPrompt(
    instruction="""Transform this real interior iPhone photograph into a high-quality, MLS-ready listing image.

The result should feel professionally photographed, bright, clean, and well-composed — without misrepresenting the space.

CORE RULE — REALITY FIRST: The room must remain recognizably the same room. No changes that would mislead a buyer.

If an improvement would require adding new objects or inventing details, do not perform it.""",
    scene="Interior property photograph requiring MLS-ready enhancement",
    must_preserve=[
        # Material & Detail Fidelity
        "Fabric grain, wood texture, and surface imperfections - no over-sharpening or AI 'polish'",
        "Original wall paint hues and color accuracy",
        "Fixed elements: vents, outlets, trims, hardware, built-ins - NEVER remove these",
        # Planar Consistency Rule
        "Floorboards, tile lines, and grout must remain straight and continuous",
        "Walls must not bow or curve - no 'rubber floor' stretching",
        "Ceiling height must not be increased",
        # Mirrors & Reflections
        "Mirror geometry and frame exactly as shown",
        "Reflections must match camera position and room contents - do not invent reflected objects",
        # Shadow Preservation
        "Natural shadow direction and softness - lift subtly without removing",
        "Objects must remain grounded - no floating furniture",
        # Windows & Exterior Content
        "Exact exterior view if visible through windows",
        "If window view is blown out in original, keep it naturally blown out",
        "Do not invent sky detail, greenery, buildings, or sun direction",
        "Interior lighting must remain consistent with window direction",
        # Furniture Rules
        "Furniture count must remain identical - do not add or remove furniture",
    ],
    may_remove=[
        "Small clutter: cables, papers, trash, toiletries, pet items",
        "People, animals, and their reflections - replace removed areas with logically continued surfaces (no blur or masking artifacts)",
        "Camera/photographer reflections from mirrors - remove cleanly",
    ],
    camera=CameraSpec(
        height="40-48 inches (eye level)",
        focal_length="24-28mm wide-angle equivalent",
        perspective="preserve vertical lines, no fisheye, no ceiling stretch, do not exaggerate room size or depth",
    ),
    lighting=LightingSpec(
        color_temp="~5200K neutral daylight white balance",
        exposure="+0.2-0.3 EV lift on walls and ceilings",
        balance="bright, clean, controlled - recover highlights, open shadows without flattening depth",
        shadows="lift subtly without removing them, preserve natural direction and softness",
    ),
    output_constraints=[
        "All screens (TVs, monitors, tablets) must be OFF - appear black or dark neutral",
        "Replace removed areas with logically continued surfaces - no blur or masking artifacts",
        "No over-sharpening or AI 'polish'",
        "No artificial depth blur or fake light sources",
        "Do not invent reflected objects in mirrors",
        "May reposition or rotate existing furniture ONLY to improve flow and symmetry",
        "May adjust camera position slightly as if photographer stepped a few feet left/right or raised/lowered tripod",
    ],
    avoid=[
        # Hard Stops - NEVER DO
        "Adding rugs, plants, decor, artwork, or staging items",
        "Adding new furniture of any kind",
        "Replacing furniture with different styles",
        "Inventing windows, lights, furniture, or architectural features",
        "Removing fixed elements (vents, outlets, trims, hardware)",
        "Blurring to hide changes",
        # Lighting Artifacts
        "HDR halos, glow, bloom, or plastic smoothing",
    ],
    style_name="luster",
    style_modifiers={
        "aesthetic": "MLS-ready professional real estate photography",
        "mood": "bright, clean, well-composed, honest",
    },
)


BRIGHT_AIRY_PRESET = EnhancementPrompt(
    instruction="""Transform this real interior iPhone photograph into a bright, airy, MLS-ready listing image with crisp neutral whites and flambient lighting technique.

The result should feel professionally photographed, spacious, and inviting — without misrepresenting the space.

CORE RULE — REALITY FIRST: The room must remain recognizably the same room. No changes that would mislead a buyer.

If an improvement would require adding new objects or inventing details, do not perform it.""",
    scene="Interior property photograph requiring bright, airy enhancement",
    must_preserve=[
        # Material & Detail Fidelity
        "Fabric grain, wood texture, and surface imperfections - no over-sharpening or AI 'polish'",
        "Original wall paint hues - no drift to pure white",
        "Fixed elements: vents, outlets, trims, hardware, built-ins - NEVER remove these",
        "Wood warmth in floors and cabinets",
        "Matte vs gloss surface distinctions",
        # Planar Consistency Rule
        "Floorboards, tile lines, and grout must remain straight and continuous",
        "Walls must not bow or curve - no 'rubber floor' stretching",
        "Ceiling height must not be increased",
        # Mirrors & Reflections
        "Mirror geometry and frame exactly as shown",
        "Reflections must match camera position and room contents - do not invent reflected objects",
        # Shadow Preservation
        "Natural shadow direction and softness - lift subtly without removing",
        "Objects must remain grounded - no floating furniture",
        # Windows & Exterior Content
        "Exact exterior view if visible through windows",
        "If window view is blown out in original, keep it naturally blown out",
        "Do not invent sky detail, greenery, buildings, or sun direction",
        "Interior lighting must remain consistent with window direction",
        # Furniture Rules
        "Furniture count must remain identical - do not add or remove furniture",
    ],
    may_remove=[
        "Small clutter: cables, papers, trash, toiletries, pet items",
        "People, animals, and their reflections - replace removed areas with logically continued surfaces (no blur or masking artifacts)",
        "Camera/photographer reflections from mirrors - remove cleanly",
    ],
    camera=CameraSpec(
        height="40-48 inches (eye level)",
        focal_length="24-28mm wide-angle equivalent",
        perspective="preserve vertical lines, no fisheye, no ceiling stretch, do not exaggerate room size or depth",
    ),
    lighting=LightingSpec(
        color_temp="5200K crisp neutral daylight - whites must read bright and paper-clean",
        exposure="+0.2-0.3 EV lift on ceilings and walls for airy feel",
        balance="professional HDR depth with full shadow-to-highlight detail, windows 0.5-1 stop darker than interior",
        shadows="natural roll-off with believable soft fill, recessed lights glow without clipping",
    ),
    output_constraints=[
        "All screens (TVs, monitors, tablets) must be OFF - appear black or dark neutral",
        "Replace removed areas with logically continued surfaces - no blur or masking artifacts",
        "Zero yellow/orange or blue/green color casts on whites",
        "No over-sharpening or AI 'polish'",
        "No artificial depth blur or fake light sources",
        "Do not invent reflected objects in mirrors",
        "May reposition or rotate existing furniture ONLY to improve flow and symmetry",
        "May adjust camera position slightly as if photographer stepped a few feet left/right or raised/lowered tripod",
        "Preserve texture without blown highlights",
    ],
    avoid=[
        # Hard Stops - NEVER DO
        "Adding rugs, plants, decor, artwork, or staging items",
        "Adding new furniture of any kind",
        "Replacing furniture with different styles",
        "Inventing windows, lights, furniture, or architectural features",
        "Removing fixed elements (vents, outlets, trims, hardware)",
        "Blurring to hide changes",
        # Lighting Artifacts
        "HDR halos, glow, bloom, or plastic smoothing",
        "Color cast contamination on whites",
        "Over-processed HDR appearance",
    ],
    style_name="bright_airy",
    style_modifiers={
        "aesthetic": "bright airy flambient",
        "white_balance": "crisp neutral 5200K",
    },
)


WARM_PRESET = EnhancementPrompt(
    instruction="""Transform this real interior iPhone photograph into a warm, inviting, MLS-ready listing image with cozy tones.

The result should feel professionally photographed, warm, and welcoming — without misrepresenting the space.

CORE RULE — REALITY FIRST: The room must remain recognizably the same room. No changes that would mislead a buyer.

If an improvement would require adding new objects or inventing details, do not perform it.""",
    scene="Interior property photograph requiring warm, inviting enhancement",
    must_preserve=[
        # Material & Detail Fidelity
        "Fabric grain, wood texture, and surface imperfections - no over-sharpening or AI 'polish'",
        "Original wall paint hues and warm undertones",
        "Fixed elements: vents, outlets, trims, hardware, built-ins - NEVER remove these",
        "Wood warmth in floors, cabinets, and furniture",
        "Matte vs gloss surface distinctions",
        # Planar Consistency Rule
        "Floorboards, tile lines, and grout must remain straight and continuous",
        "Walls must not bow or curve - no 'rubber floor' stretching",
        "Ceiling height must not be increased",
        # Mirrors & Reflections
        "Mirror geometry and frame exactly as shown",
        "Reflections must match camera position and room contents - do not invent reflected objects",
        # Shadow Preservation
        "Natural shadow direction and softness - lift subtly without removing",
        "Objects must remain grounded - no floating furniture",
        # Windows & Exterior Content
        "Exact exterior view if visible through windows",
        "If window view is blown out in original, keep it naturally blown out",
        "Do not invent sky detail, greenery, buildings, or sun direction",
        "Interior lighting must remain consistent with window direction",
        # Furniture Rules
        "Furniture count must remain identical - do not add or remove furniture",
    ],
    may_remove=[
        "Small clutter: cables, papers, trash, toiletries, pet items",
        "People, animals, and their reflections - replace removed areas with logically continued surfaces (no blur or masking artifacts)",
        "Camera/photographer reflections from mirrors - remove cleanly",
    ],
    camera=CameraSpec(
        height="40-48 inches (eye level)",
        focal_length="24-28mm wide-angle equivalent",
        perspective="preserve vertical lines, no fisheye, no ceiling stretch, do not exaggerate room size or depth",
    ),
    lighting=LightingSpec(
        color_temp="4500-5000K slightly warm daylight with golden undertones",
        exposure="+0.2-0.3 EV lift on walls and ceilings",
        balance="warm, inviting atmosphere with natural color warmth - not orange, just cozy",
        shadows="soft, natural shadow roll-off with warm fill tones",
    ),
    output_constraints=[
        "All screens (TVs, monitors, tablets) must be OFF - appear black or dark neutral",
        "Replace removed areas with logically continued surfaces - no blur or masking artifacts",
        "Subtle warm color grading without orange cast",
        "No over-sharpening or AI 'polish'",
        "No artificial depth blur or fake light sources",
        "Do not invent reflected objects in mirrors",
        "May reposition or rotate existing furniture ONLY to improve flow and symmetry",
        "May adjust camera position slightly as if photographer stepped a few feet left/right or raised/lowered tripod",
        "Preserve natural wood tones and enhance their warmth",
    ],
    avoid=[
        # Hard Stops - NEVER DO
        "Adding rugs, plants, decor, artwork, or staging items",
        "Adding new furniture of any kind",
        "Replacing furniture with different styles",
        "Inventing windows, lights, furniture, or architectural features",
        "Removing fixed elements (vents, outlets, trims, hardware)",
        "Blurring to hide changes",
        # Lighting Artifacts
        "HDR halos, glow, bloom, or plastic smoothing",
        "Orange or yellow color cast contamination",
        "Over-saturated warm tones",
    ],
    style_name="warm",
    style_modifiers={
        "aesthetic": "warm, inviting real estate photography",
        "mood": "cozy, welcoming, comfortable",
        "color_temp": "slightly warm with golden undertones",
    },
)


DUSK_PRESET = EnhancementPrompt(
    instruction="""Transform this property photograph into an MLS-ready twilight/dusk image with warm golden hour lighting.

The result should feel professionally photographed with inviting evening atmosphere — without misrepresenting the space.

CORE RULE — REALITY FIRST: The property must remain recognizably the same. No changes that would mislead a buyer.

If an improvement would require adding new objects or inventing details, do not perform it.""",
    scene="Property photograph for twilight/dusk presentation",
    must_preserve=[
        # Material & Detail Fidelity
        "Fabric grain, wood texture, and surface imperfections - no over-sharpening or AI 'polish'",
        "All architectural features and building structure",
        "Fixed elements: vents, outlets, trims, hardware, built-ins - NEVER remove these",
        # Planar Consistency Rule
        "Floorboards, tile lines, and grout must remain straight and continuous",
        "Walls must not bow or curve - no 'rubber floor' stretching",
        "Ceiling height must not be increased",
        # Mirrors & Reflections
        "Mirror geometry and frame exactly as shown",
        "Reflections must match camera position and room contents - do not invent reflected objects",
        # Shadow Preservation
        "Natural shadow direction matching low sun angle",
        "Objects must remain grounded - no floating furniture",
        # Windows & Exterior Content
        "Window and door placements exactly as shown",
        "Landscaping and hardscaping elements",
        # Furniture Rules
        "Furniture count must remain identical - do not add or remove furniture",
        "Furniture positions and layout",
    ],
    may_remove=[
        "Small clutter: cables, papers, trash, toiletries, pet items",
        "People, animals, and their reflections - replace removed areas with logically continued surfaces (no blur or masking artifacts)",
        "Camera/photographer reflections from mirrors - remove cleanly",
    ],
    camera=CameraSpec(
        height="40-48 inches or exterior appropriate height",
        focal_length="24-35mm range",
        perspective="preserve vertical lines, no fisheye, no ceiling stretch, do not exaggerate room size or depth",
    ),
    lighting=LightingSpec(
        color_temp="2500-3000K warm golden hour",
        exposure="balanced interior/exterior with interior slightly brighter",
        balance="warm, inviting, cozy atmosphere with natural color gradients of evening light",
        shadows="soft directional shadows from low sun angle - realistic patterns for time of day",
    ),
    output_constraints=[
        "All screens (TVs, monitors, tablets) must be OFF - appear black or dark neutral",
        "Replace removed areas with logically continued surfaces - no blur or masking artifacts",
        "Interior lights appear warmly illuminated",
        "No over-sharpening or AI 'polish'",
        "No artificial depth blur or fake light sources",
        "Do not invent reflected objects in mirrors",
        "May reposition or rotate existing furniture ONLY to improve flow and symmetry",
        "May adjust camera position slightly as if photographer stepped a few feet left/right or raised/lowered tripod",
    ],
    avoid=[
        # Hard Stops - NEVER DO
        "Adding rugs, plants, decor, artwork, or staging items",
        "Adding new furniture of any kind",
        "Replacing furniture with different styles",
        "Inventing windows, lights, furniture, or architectural features",
        "Removing fixed elements (vents, outlets, trims, hardware)",
        "Blurring to hide changes",
        # Lighting Artifacts
        "HDR halos, glow, bloom, or plastic smoothing",
        "Multiple artificial sun positions",
        "Over-saturated colors",
        "Unrealistic lighting effects",
    ],
    style_name="dusk",
    style_modifiers={
        "aesthetic": "twilight golden hour",
        "mood": "warm and inviting",
    },
)


SKY_REPLACEMENT_PRESET = EnhancementPrompt(
    instruction="""Enhance this exterior photograph with a beautiful clear blue sky, removing overcast or gray weather while maintaining photographic realism.

The result should feel professionally photographed with improved weather — without misrepresenting the property.

CORE RULE — REALITY FIRST: The property must remain recognizably the same. No changes that would mislead a buyer.

If an improvement would require adding new objects or inventing details (beyond sky), do not perform it.""",
    scene="Exterior property photograph with sky visible",
    must_preserve=[
        # Building & Architecture
        "All building lines, rooflines, and architectural details exactly as shown",
        "Window positions and reflections",
        "Fixed elements: vents, outlets, trims, hardware - NEVER remove these",
        # Planar Consistency Rule
        "Building walls must not bow or curve",
        "Roof lines must remain straight",
        # Property Features
        "Landscaping and hardscaping elements",
        "Property boundaries and features",
        "Atmospheric perspective and depth",
        # Shadow Preservation
        "Shadow directions must match new sky lighting direction",
        "Objects must remain grounded - no floating elements",
        # Furniture Rules (if outdoor furniture visible)
        "Outdoor furniture count must remain identical - do not add or remove",
    ],
    may_remove=[
        "Overcast or gray sky conditions (replace with clear blue)",
        "Rain, snow, or stormy elements",
        "Hazy or polluted atmosphere",
        "People, animals, and their reflections - replace removed areas with logically continued surfaces (no blur or masking artifacts)",
        "Camera/photographer reflections - remove cleanly",
    ],
    camera=CameraSpec(
        height="appropriate for exterior shot",
        focal_length="24-35mm",
        perspective="preserve vertical lines, no fisheye, do not exaggerate property size or depth",
    ),
    lighting=LightingSpec(
        color_temp="match sky to existing scene lighting direction",
        exposure="balanced sky with foreground",
        balance="natural daylight appearance",
        shadows="shadows must match new sky lighting direction",
    ),
    output_constraints=[
        "Sky replacement appears natural and undetectable",
        "Color grading matches between sky and foreground",
        "Proper exposure balance maintained",
        "Realistic cloud formations only - subtle natural clouds",
        "Seamless integration with architecture",
        "Replace removed areas with logically continued surfaces - no blur or masking artifacts",
        "No over-sharpening or AI 'polish'",
        "May adjust camera position slightly as if photographer stepped a few feet left/right",
    ],
    avoid=[
        # Hard Stops - NEVER DO
        "Adding rugs, plants, decor, artwork, or staging items",
        "Adding new furniture of any kind",
        "Inventing windows, lights, furniture, or architectural features",
        "Removing fixed elements (vents, outlets, trims, hardware)",
        "Blurring to hide changes",
        "Altering building structures",
        # Sky-Specific
        "Fantasy or unrealistic sky colors",
        "Dramatic or artificial cloud formations",
        "Mismatched lighting directions between sky and property",
        # Lighting Artifacts
        "HDR halos, glow, bloom, or plastic smoothing",
    ],
    style_name="sky_replacement",
    style_modifiers={
        "sky_type": "clear blue with subtle natural clouds",
    },
)


LAWN_CLEANUP_PRESET = EnhancementPrompt(
    instruction="""Enhance the landscaping in this property photograph, making grass greener and more manicured while maintaining authenticity.

The result should feel professionally photographed with improved curb appeal — without misrepresenting the property.

CORE RULE — REALITY FIRST: The property must remain recognizably the same. No changes that would mislead a buyer.

If an improvement would require adding new landscaping features or inventing details, do not perform it.""",
    scene="Exterior property photograph with lawn/landscaping visible",
    must_preserve=[
        # Hardscaping & Structure
        "All hardscaping (walkways, driveways, patios, walls) exactly as shown",
        "Fencing and property boundaries",
        "Fixed elements: outdoor fixtures, built-in features - NEVER remove these",
        # Planar Consistency Rule
        "Walkways and driveways must remain straight and level",
        "Property lines must not be altered",
        # Plant & Lawn Authenticity
        "Authentic plant species and placements",
        "Natural variations in lawn texture",
        "Seasonal appropriateness of vegetation",
        # Shadow Preservation
        "Natural shadow direction consistent with sun position",
        "Objects must remain grounded - no floating elements",
        # Furniture Rules
        "Outdoor furniture count must remain identical - do not add or remove",
        "Outdoor furniture and fixtures positions",
    ],
    may_remove=[
        "Brown spots in grass (enhance to healthy green)",
        "Weeds and dead vegetation",
        "Lawn debris and leaves",
        "Dead or dying plants (enhance existing healthy plants)",
        "People, animals, and their reflections - replace removed areas with logically continued surfaces (no blur or masking artifacts)",
        "Camera/photographer reflections - remove cleanly",
    ],
    camera=CameraSpec(
        height="appropriate for exterior shot",
        focal_length="24-35mm",
        perspective="preserve vertical lines, do not exaggerate property size or depth",
    ),
    lighting=LightingSpec(
        color_temp="natural daylight",
        exposure="well-balanced for landscape",
        balance="natural outdoor lighting",
        shadows="consistent with sun position",
    ),
    output_constraints=[
        "Healthy, vibrant green grass appearance",
        "Realistic grass texture and growth patterns - not artificial perfection",
        "Improved overall lawn uniformity",
        "Enhanced flower beds and plantings (existing only)",
        "Natural imperfections preserved for authenticity",
        "Replace removed areas with logically continued surfaces - no blur or masking artifacts",
        "No over-sharpening or AI 'polish'",
        "May adjust camera position slightly as if photographer stepped a few feet left/right",
    ],
    avoid=[
        # Hard Stops - NEVER DO
        "Adding new landscaping features, plants, trees, or shrubs",
        "Adding rugs, decor, artwork, or staging items",
        "Adding new outdoor furniture of any kind",
        "Inventing architectural features",
        "Removing existing hardscaping",
        "Blurring to hide changes",
        "Expanding property boundaries",
        # Landscaping-Specific
        "Artificial or fantasy landscaping",
        "Unrealistic grass color or texture",
        # Lighting Artifacts
        "HDR halos, glow, bloom, or plastic smoothing",
    ],
    style_name="lawn_cleanup",
    style_modifiers={
        "grass_color": "healthy vibrant green",
    },
)


# Style registry
STYLE_PRESETS = {
    "default": LUSTER_PRESET,
    "luster": LUSTER_PRESET,
    "bright_airy": BRIGHT_AIRY_PRESET,
    "flambient": BRIGHT_AIRY_PRESET,  # alias - Natural style in mobile app
    "warm": WARM_PRESET,               # Warm style in mobile app
    "dusk": DUSK_PRESET,
    "twilight": DUSK_PRESET,  # alias
    "sky_replacement": SKY_REPLACEMENT_PRESET,
    "lawn_cleanup": LAWN_CLEANUP_PRESET,
}


# Room-specific additions
ROOM_ADDITIONS = {
    "living_room": {
        "scene_suffix": " - living room/family room",
        "must_preserve_add": ["Comfortable seating arrangements", "Entertainment center positioning"],
        "style_modifiers_add": {"room_focus": "warm, inviting living space"},
    },
    "kitchen": {
        "scene_suffix": " - kitchen/cooking area",
        "must_preserve_add": ["Countertop surfaces and backsplash", "Appliance positions"],
        "style_modifiers_add": {"room_focus": "functional, clean workspace"},
    },
    "bedroom": {
        "scene_suffix": " - bedroom/sleeping area",
        "must_preserve_add": ["Bed positioning and bedding arrangement", "Nightstand placements"],
        "style_modifiers_add": {"room_focus": "serene, restful atmosphere"},
    },
    "bathroom": {
        "scene_suffix": " - bathroom/powder room",
        "must_preserve_add": ["Fixtures and plumbing", "Mirror and vanity positions"],
        "style_modifiers_add": {"room_focus": "clean, spa-like ambiance"},
    },
    "dining_room": {
        "scene_suffix": " - dining room/eating area",
        "must_preserve_add": ["Table and chair arrangement", "Lighting fixture positions"],
        "style_modifiers_add": {"room_focus": "entertaining potential"},
    },
    "home_office": {
        "scene_suffix": " - office/study",
        "must_preserve_add": ["Desk and workspace setup", "Shelving and storage"],
        "style_modifiers_add": {"room_focus": "productivity and organization"},
    },
    "exterior": {
        "scene_suffix": " - exterior/outdoor",
        "must_preserve_add": ["Landscaping elements", "Architectural facade details"],
        "style_modifiers_add": {"room_focus": "curb appeal"},
    },
}


class PromptBuilder:
    """
    Fluent builder for creating structured enhancement prompts.

    Usage:
        prompt = (PromptBuilder("luster")
            .with_room_type("kitchen")
            .with_additional_preserve(["Special feature X"])
            .build())

        # Get structured text for OpenAI
        text = prompt.to_structured_text()

        # Get JSON for database storage
        json_params = prompt.to_json()
    """

    def __init__(self, style: str = "default"):
        """
        Initialize builder with a base style.

        Args:
            style: Style preset name (default, luster, bright_airy, dusk, etc.)
        """
        base = STYLE_PRESETS.get(style, STYLE_PRESETS["default"])
        # Deep copy to avoid mutating the preset
        self._prompt = EnhancementPrompt(
            instruction=base.instruction,
            scene=base.scene,
            must_preserve=list(base.must_preserve),
            may_remove=list(base.may_remove),
            camera=CameraSpec(
                height=base.camera.height,
                focal_length=base.camera.focal_length,
                perspective=base.camera.perspective,
            ),
            lighting=LightingSpec(
                color_temp=base.lighting.color_temp,
                exposure=base.lighting.exposure,
                balance=base.lighting.balance,
                shadows=base.lighting.shadows,
            ),
            output_constraints=list(base.output_constraints),
            avoid=list(base.avoid),
            style_name=style,
            style_modifiers=dict(base.style_modifiers),
        )

    def with_room_type(self, room_type: str) -> 'PromptBuilder':
        """Add room-specific context and constraints."""
        if room_type in ROOM_ADDITIONS:
            additions = ROOM_ADDITIONS[room_type]
            self._prompt.scene += additions.get("scene_suffix", "")
            self._prompt.must_preserve.extend(additions.get("must_preserve_add", []))
            self._prompt.style_modifiers.update(additions.get("style_modifiers_add", {}))
        return self

    def with_scene(self, scene: str) -> 'PromptBuilder':
        """Override the scene description."""
        self._prompt.scene = scene
        return self

    def with_instruction(self, instruction: str) -> 'PromptBuilder':
        """Override the instruction."""
        self._prompt.instruction = instruction
        return self

    def with_additional_preserve(self, items: list) -> 'PromptBuilder':
        """Add additional items to must_preserve list."""
        self._prompt.must_preserve.extend(items)
        return self

    def with_additional_remove(self, items: list) -> 'PromptBuilder':
        """Add additional items to may_remove list."""
        self._prompt.may_remove.extend(items)
        return self

    def with_additional_avoid(self, items: list) -> 'PromptBuilder':
        """Add additional items to avoid list."""
        self._prompt.avoid.extend(items)
        return self

    def with_camera(self, camera: CameraSpec) -> 'PromptBuilder':
        """Override camera specifications."""
        self._prompt.camera = camera
        return self

    def with_lighting(self, lighting: LightingSpec) -> 'PromptBuilder':
        """Override lighting specifications."""
        self._prompt.lighting = lighting
        return self

    def with_style_modifier(self, key: str, value: str) -> 'PromptBuilder':
        """Add a style modifier."""
        self._prompt.style_modifiers[key] = value
        return self

    def build(self) -> EnhancementPrompt:
        """Build and return the final EnhancementPrompt."""
        return self._prompt

    def to_structured_text(self) -> str:
        """Shortcut to get structured text output."""
        return self._prompt.to_structured_text()

    def to_dict(self) -> dict:
        """Shortcut to get dictionary output."""
        return self._prompt.to_dict()

    def to_json(self) -> str:
        """Shortcut to get JSON output."""
        return self._prompt.to_json()


# =============================================================================
# Convenience Functions
# =============================================================================

def get_structured_prompt(
    style: str = "default",
    room_type: str = None,
) -> str:
    """
    Get a structured prompt text for the given style and room type.

    Args:
        style: Style preset name
        room_type: Optional room type for context

    Returns:
        Structured text prompt ready for GPT-Image
    """
    builder = PromptBuilder(style)
    if room_type:
        builder = builder.with_room_type(room_type)
    return builder.to_structured_text()


def get_prompt_params(
    style: str = "default",
    room_type: str = None,
) -> dict:
    """
    Get structured prompt parameters for database storage.

    Args:
        style: Style preset name
        room_type: Optional room type for context

    Returns:
        Dictionary of prompt parameters
    """
    builder = PromptBuilder(style)
    if room_type:
        builder = builder.with_room_type(room_type)
    return builder.to_dict()


def get_available_styles() -> dict:
    """Get all available style presets with descriptions."""
    return {
        "default": "Professional editorial real estate photography (alias for luster)",
        "luster": "Luxury editorial real estate photography with magazine quality",
        "bright_airy": "Bright, airy interior with crisp whites and flambient lighting",
        "flambient": "Alias for bright_airy style (Natural in mobile app)",
        "warm": "Warm, inviting interior with cozy golden undertones (Warm in mobile app)",
        "dusk": "Warm evening atmosphere with golden hour lighting",
        "twilight": "Alias for dusk style",
        "sky_replacement": "Clear blue sky replacement for exterior shots",
        "lawn_cleanup": "Enhanced landscaping with manicured grass and gardens",
    }


def get_available_room_types() -> dict:
    """Get all available room types with descriptions."""
    return {
        "living_room": "Living rooms and family rooms",
        "kitchen": "Kitchens and breakfast areas",
        "bedroom": "Bedrooms and master suites",
        "bathroom": "Bathrooms and powder rooms",
        "dining_room": "Dining rooms and eating areas",
        "home_office": "Offices and study areas",
        "exterior": "Exterior and outdoor spaces",
    }
