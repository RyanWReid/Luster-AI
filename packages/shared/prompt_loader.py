"""
Single source of truth for prompt loading and merging.

Usage:
    from packages.shared.prompt_loader import build_prompt, get_available_styles

    # Build a merged prompt (default + style)
    prompt = build_prompt("bright")

    # List valid style keys
    styles = get_available_styles()
"""

from pathlib import Path

PROMPTS_DIR = Path(__file__).parent / "prompts"

VALID_STYLES = {"bright", "neutral", "warm", "evening", "noir", "soft"}

# Default style used when none specified or style is invalid
DEFAULT_STYLE = "neutral"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8").strip()


def build_prompt(style: str = DEFAULT_STYLE) -> str:
    """
    Merge default.md + styles/style_{style}.md into a single prompt string.

    Args:
        style: One of "bright", "neutral", "warm".
               Falls back to DEFAULT_STYLE if invalid.

    Returns:
        Combined prompt string ready to send to OpenAI.
    """
    if style not in VALID_STYLES:
        style = DEFAULT_STYLE

    default_text = _read(PROMPTS_DIR / "default.md")
    style_text = _read(PROMPTS_DIR / "styles" / f"style_{style}.md")

    return f"{style_text}\n\n{default_text}"


def get_available_styles() -> dict[str, str]:
    """Return mapping of style key -> display name."""
    return {
        "bright": "Bright",
        "neutral": "Neutral",
        "warm": "Warm",
        "evening": "Evening",
        "noir": "Noir",
        "soft": "Soft",
    }
