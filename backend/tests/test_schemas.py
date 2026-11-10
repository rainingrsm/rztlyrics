"""Пограничные проверки общего соглашения: draft/null, integer ms, интервалы и лимиты."""

import pytest
from pydantic import ValidationError

from app.schemas.projects import LyricLine, LyricsUpdate, validate_render_ready


def line(start: int | None = 0, end: int | None = 100, line_id: str = "a") -> LyricLine:
    return LyricLine(id=line_id, text="Наша строка", start_ms=start, end_ms=end)


def test_draft_can_have_missing_times_but_render_cannot() -> None:
    draft = LyricsUpdate(lines=[line(None, None)])
    with pytest.raises(ValueError, match="задайте начало"):
        validate_render_ready(draft, 5000)


@pytest.mark.parametrize("value", [-1, 1.5, "100", True])
def test_start_requires_nonnegative_integer(value) -> None:
    with pytest.raises(ValidationError):
        LyricLine(id="a", text="Текст", start_ms=value)


@pytest.mark.parametrize("start,end", [(100, 100), (100, 99), (0, 99)])
def test_too_short_or_reversed_interval_is_invalid(start, end) -> None:
    with pytest.raises(ValidationError):
        line(start, end)


def test_touching_lines_and_gaps_are_valid() -> None:
    draft = LyricsUpdate(lines=[line(0, 100, "a"), line(100, 200, "b"), line(400, 500, "c")])
    validate_render_ready(draft, 5000)


@pytest.mark.parametrize("second", [(99, 200), (4900, 5100)])
def test_overlap_and_out_of_audio_are_invalid(second) -> None:
    draft = LyricsUpdate(lines=[line(), line(*second, "b")])
    with pytest.raises(ValueError):
        validate_render_ready(draft, 5000)


def test_duplicate_ids_rejected_but_duplicate_text_allowed() -> None:
    with pytest.raises(ValidationError):
        LyricsUpdate(lines=[line(), line(100, 200)])
    LyricsUpdate(lines=[line(), line(100, 200, "b")])


@pytest.mark.parametrize("line_id", ["", " ", "\t\n", "a" * 65])
def test_blank_or_oversized_line_id_rejected(line_id: str) -> None:
    with pytest.raises(ValidationError):
        line(line_id=line_id)


def test_text_and_count_limits() -> None:
    LyricLine(id="a", text="я" * 120)
    for text in (" ", "я" * 121):
        with pytest.raises(ValidationError):
            LyricLine(id="a", text=text)
    with pytest.raises(ValidationError):
        LyricsUpdate(lines=[line(line_id=str(index)) for index in range(101)])


def test_empty_draft_is_allowed_but_empty_render_is_not() -> None:
    with pytest.raises(ValueError, match="хотя бы"):
        validate_render_ready(LyricsUpdate(), 5000)
