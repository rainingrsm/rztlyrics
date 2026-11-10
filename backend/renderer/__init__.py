"""Независимый от HTTP и очереди модуль создания lyrics-видео.

Каркас: контракт и валидация готовы; сам рендер ещё не реализован.
"""

from renderer.models import LyricLine, RenderResult, RenderSpec
from renderer.render import render_video

__all__ = ["LyricLine", "RenderResult", "RenderSpec", "render_video"]
