"""
Shared prompt templates for Luster AI image enhancement
"""

# Style preset prompts
STYLE_PRESETS = {
    "default": """Transform this interior photo into a photorealistic, luxury-grade real estate image styled as if photographed by a top-tier editorial real estate photographer. Balance realism and artistry with natural texture, lived-in warmth, and authentic light flow. The output must remain structurally accurate, editorial in quality, and fully MLS-ready.

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
• No brand names or fantasy elements""",

    "bright_airy": """Transform this interior photo into a bright, airy real estate image with crisp neutral whites and professional flambient lighting. Create an editorial-quality result that feels spacious and inviting while maintaining structural accuracy.

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
• No synthetic lighting effects or halos""",

    "dusk": """Transform this real estate photo with warm dusk lighting and golden hour ambiance. Create an inviting evening atmosphere that showcases the property's cozy and welcoming qualities while maintaining architectural accuracy.

DUSK LIGHTING CHARACTERISTICS:
• Warm golden hour color temperature (2500-3000K)
• Soft directional light from low sun angle
• Rich amber and orange tones in natural lighting
• Interior lighting appears warm and inviting
• Subtle contrast between interior and exterior lighting

ATMOSPHERIC ENHANCEMENTS:
• Create magical hour ambiance with warm, diffused light
• Interior lights glow warmly through windows
• Maintain realistic shadow patterns for time of day
• Balance exterior twilight with interior illumination
• Preserve natural color gradients of evening light

STAGING & PRESENTATION:
• Ensure interior lights are tastefully illuminated
• Remove clutter while maintaining lived-in warmth
• Clean and polish all surfaces
• Preserve all architectural details and proportions
• No artificial mood lighting or effects

PRESERVE ACCURACY:
• Maintain exact structural elements
• Keep realistic lighting physics
• Preserve material textures and finishes
• No expansion of spaces or layouts
• No addition of furniture or major décor

FORBIDDEN:
• No pets, people, or their reflections
• No unrealistic lighting effects or halos
• No artificial sun positions or multiple light sources
• No brand names or fantasy elements""",

    "sky_replacement": """Enhance this real estate photo with a beautiful clear blue sky, removing any overcast or gray weather while preserving all architectural details and maintaining photographic realism.

SKY ENHANCEMENT SPECIFICATIONS:
• Replace overcast/gray sky with clear blue sky
• Maintain realistic cloud formations (subtle, natural)
• Preserve correct lighting conditions and shadows
• Match sky color temperature to overall image tone
• Ensure seamless integration with existing architecture

WEATHER OPTIMIZATION:
• Remove rain, snow, or stormy conditions
• Clear up hazy or polluted atmospheric conditions  
• Maintain realistic atmospheric perspective
• Preserve natural horizon line and positioning
• Keep consistent lighting direction and quality

ARCHITECTURAL PRESERVATION:
• Maintain exact building lines and proportions
• Preserve all rooflines, windows, and exterior details
• Keep accurate shadows that match new sky conditions
• Maintain realistic reflection in windows and surfaces
• No alteration to landscaping or hardscaping

PHOTOGRAPHIC REALISM:
• Ensure sky replacement appears natural and undetectable
• Match color grading between sky and foreground
• Preserve depth of field and atmospheric haze
• Maintain proper exposure balance
• Keep realistic color temperature consistency

FORBIDDEN:
• No fantasy skies or unrealistic colors
• No dramatic or artificial cloud formations
• No alteration of building structures
• No pets, people, or their reflections
• No brand names or added elements""",

    "lawn_cleanup": """Clean up and enhance the landscaping in this real estate photo, making grass greener and more manicured while keeping all hardscaping authentic and maintaining photographic realism.

LANDSCAPING ENHANCEMENTS:
• Enhance grass color to healthy, vibrant green
• Clean up brown spots, weeds, or dead vegetation
• Improve overall lawn uniformity and appearance
• Maintain realistic grass texture and growth patterns
• Preserve natural variations in lawn height and density

GARDEN IMPROVEMENTS:
• Enhance existing flower beds and plantings
• Remove dead or dying vegetation
• Improve color saturation of healthy plants
• Clean up mulch beds and garden borders
• Maintain authentic plant species and placement

HARDSCAPING PRESERVATION:
• Keep all walkways, driveways, and patios exactly as-is
• Preserve fencing, walls, and built structures
• Maintain accurate property boundaries and features
• No alteration to outdoor furniture or fixtures
• Keep realistic wear patterns on hardscaping

NATURAL APPEARANCE:
• Maintain seasonal appropriateness for plantings
• Preserve natural imperfections for authenticity
• Keep realistic plant growth and placement
• Maintain proper scale and proportions
• No artificial perfection or fantasy landscaping

FORBIDDEN:
• No addition of new landscaping features
• No removal of existing hardscaping
• No pets, people, or their reflections
• No brand names or artificial elements
• No expansion of property boundaries"""
}

# Room-specific enhancement prompts
ROOM_PRESETS = {
    "living_room": "Focus on creating a warm, inviting living space with balanced furniture arrangement and optimal natural lighting flow. Emphasize comfortable seating areas and architectural features.",
    
    "kitchen": "Emphasize clean countertops, proper under-cabinet lighting, and showcase the functionality and flow of the kitchen workspace. Highlight appliances and storage solutions.",
    
    "bedroom": "Create a serene, restful atmosphere with perfectly fluffed bedding, clean surfaces, and soft, natural lighting. Focus on comfort and tranquility.",
    
    "bathroom": "Ensure spotless surfaces, proper mirror reflections, and clean, spa-like ambiance with neutral staging. Emphasize cleanliness and luxury.",
    
    "dining_room": "Highlight the dining area's entertaining potential with balanced lighting and tasteful table presentation. Showcase the space's social aspects.",
    
    "home_office": "Showcase productivity and organization with clean desk surfaces and professional lighting setup. Emphasize functionality and focus.",
    
    "exterior": "Enhance curb appeal with natural landscaping, proper exterior lighting, and architectural details. Highlight the property's outdoor features."
}

def get_style_preset(style_name: str) -> str:
    """Get a style preset by name"""
    return STYLE_PRESETS.get(style_name, STYLE_PRESETS["default"])

def get_room_preset(room_type: str) -> str:
    """Get a room-specific enhancement by type"""
    return ROOM_PRESETS.get(room_type, "")

def build_full_prompt(style_preset: str, room_type: str = None, custom_prompt: str = "") -> str:
    """Build a complete prompt combining style, room type, and custom requirements"""
    
    base_prompt = get_style_preset(style_preset)
    full_prompt = base_prompt
    
    if room_type and room_type in ROOM_PRESETS:
        full_prompt += f"\n\nROOM-SPECIFIC FOCUS: {get_room_preset(room_type)}"
    
    if custom_prompt:
        full_prompt += f"\n\nADDITIONAL REQUIREMENTS: {custom_prompt}"
    
    return full_prompt

def get_available_styles() -> dict:
    """Get all available style presets with descriptions"""
    return {
        "default": "Professional editorial real estate photography with balanced lighting",
        "bright_airy": "Bright, airy interior with crisp whites and flambient lighting",
        "dusk": "Warm evening atmosphere with golden hour lighting",
        "sky_replacement": "Clear blue sky replacement for exterior shots", 
        "lawn_cleanup": "Enhanced landscaping with manicured grass and gardens"
    }

def get_available_room_types() -> dict:
    """Get all available room types with descriptions"""
    return {
        "living_room": "Living rooms and family rooms",
        "kitchen": "Kitchens and breakfast areas",
        "bedroom": "Bedrooms and master suites", 
        "bathroom": "Bathrooms and powder rooms",
        "dining_room": "Dining rooms and eating areas",
        "home_office": "Offices and study areas",
        "exterior": "Exterior and outdoor spaces"
    }