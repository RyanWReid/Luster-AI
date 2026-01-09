"""
Shared utilities and templates for Luster AI
"""

# Legacy prompt exports (backward compatibility)
from .prompts import (
    STYLE_PRESETS as LEGACY_STYLE_PRESETS,
    ROOM_PRESETS,
    get_style_preset,
    get_room_preset,
    build_full_prompt,
    get_available_styles as get_legacy_styles,
    get_available_room_types as get_legacy_room_types,
)

# New structured prompt system (GPT-Image best practices)
from .prompt_schema import (
    EnhancementPrompt,
    CameraSpec,
    LightingSpec,
    create_prompt,
)
from .prompt_builder import (
    PromptBuilder,
    STYLE_PRESETS,
    get_structured_prompt,
    get_prompt_params,
    get_available_styles,
    get_available_room_types,
)

__all__ = [
    # Legacy (backward compatibility)
    'LEGACY_STYLE_PRESETS',
    'ROOM_PRESETS',
    'get_style_preset',
    'get_room_preset',
    'build_full_prompt',
    'get_legacy_styles',
    'get_legacy_room_types',
    # New structured system
    'EnhancementPrompt',
    'CameraSpec',
    'LightingSpec',
    'PromptBuilder',
    'STYLE_PRESETS',
    'create_prompt',
    'get_structured_prompt',
    'get_prompt_params',
    'get_available_styles',
    'get_available_room_types',
]