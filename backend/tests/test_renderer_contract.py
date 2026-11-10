"""A2: только реальные проверки реализованного контракта, не имитация рендера."""

from dataclasses import replace

import pytest

from renderer.models import LyricLine, RenderSpec
from renderer.validation import RenderValidationError, validate_spec


def valid_spec() -> RenderSpec:
    """Соседние строки и пауза допускаются правилами ручной разметки."""
    return RenderSpec(
        "brat",
        10_000,
        (
            LyricLine("one", "Первая строка", 0, 2500),
            LyricLine("two", "Та же строка может повторяться", 2500, 5000),
            LyricLine("three", "Первая строка", 6500, 10_000),
        ),
    )


def test_allows_adjacent_lines_gaps_and_repeated_text() -> None:
    validate_spec(valid_spec())


@pytest.mark.parametrize(
    ("line", "field"),
    [
        (LyricLine("two", "Текст", 2499, 5000), "lines[1].start_ms"),
        (LyricLine("two", "Текст", 2500, 2599), "lines[1].end_ms"),
        (LyricLine("two", "Текст", 2500, 10_001), "lines[1].end_ms"),
        (LyricLine("one", "Текст", 2500, 5000), "lines[1].id"),
        (LyricLine("two", " ", 2500, 5000), "lines[1].text"),
        (LyricLine("two", "я" * 121, 2500, 5000), "lines[1].text"),
        (LyricLine("two", "Текст", True, 5000), "lines[1].start_ms"),
        (LyricLine("two", "Текст", None, 5000), "lines[1].start_ms"),
    ],
)
def test_rejects_bad_line_with_useful_field(line: LyricLine, field: str) -> None:
    spec = replace(valid_spec(), lines=(valid_spec().lines[0], line))
    with pytest.raises(RenderValidationError) as caught:
        validate_spec(spec)
    assert caught.value.field == field


@pytest.mark.parametrize("duration", [4999, 60_001, 10_000.0, True])
def test_rejects_bad_audio_duration(duration: int) -> None:
    with pytest.raises(RenderValidationError, match="Длительность"):
        validate_spec(replace(valid_spec(), duration_ms=duration))


def test_rejects_negative_start() -> None:
    spec = RenderSpec("brat", 5000, (LyricLine("one", "Текст", -1, 1000),))
    with pytest.raises(RenderValidationError) as caught:
        validate_spec(spec)
    assert caught.value.field == "lines[0].start_ms"


def test_rejects_empty_spec_and_unsupported_style() -> None:
    for spec in (replace(valid_spec(), lines=()), replace(valid_spec(), style="google")):
        with pytest.raises(RenderValidationError):
            validate_spec(spec)


def test_line_count_and_text_length_boundaries() -> None:
    lines = tuple(LyricLine(str(i), "я" * 120, i * 100, (i + 1) * 100) for i in range(100))
    validate_spec(RenderSpec("brat", 10_000, lines))
    with pytest.raises(RenderValidationError) as caught:
        validate_spec(RenderSpec("brat", 20_000, lines + (LyricLine("100", "Ещё", 10000, 10100),)))
    assert caught.value.field == "lines"


def test_line_id_length_boundary() -> None:
    line = LyricLine("я" * 64, "Текст", 0, 1000)
    validate_spec(RenderSpec("brat", 5000, (line,)))
    with pytest.raises(RenderValidationError) as caught:
        validate_spec(RenderSpec("brat", 5000, (replace(line, id="я" * 65),)))
    assert caught.value.field == "lines[0].id"
