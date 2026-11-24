import pytest

from renderer.ass import build_ass, escape_text, format_timestamp, wrap_text
from renderer.models import LyricLine, RenderSpec
from renderer.validation import RenderValidationError


def test_wrap_preserves_short_text_and_explicit_breaks():
    assert wrap_text("Привет, 123\r\n\nмир", 500, 32) == "Привет, 123\n\nмир"


def test_wrap_prefers_words():
    assert wrap_text("слово слово", 120, 32) == "слово\nслово"


def test_wrap_measures_glyphs():
    assert wrap_text("iiii", 50, 32) == "iiii"
    assert wrap_text("ШШШШ", 50, 32) == "Ш\nШ\nШ\nШ"


def test_wrap_long_word_within_frame():
    text = "Ж" * 120
    lines = wrap_text(text, 10000, 48).splitlines()
    assert len(lines) > 1
    assert "".join(lines) == text
    assert all(len(line) <= 11 for line in lines)


@pytest.mark.parametrize(("text", "width"), [("Ж", 1), ("строка\n" * 40, 500)])
def test_wrap_reports_overflow(text, width):
    with pytest.raises(ValueError, match="не помещается"):
        wrap_text(text, width, 32)


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("Привет, мир!", "Привет, мир!"),
        ('Он сказал: "Привет"', 'Он сказал: "Привет"'),
        ("", ""),
        ("  два  слова  ", "  два  слова  "),
        ("{припев}", r"\{припев\}"),
        (r"{\b1}Привет", "\\{\\\u2060b1\\}Привет"),
        (r"Это \N обычный текст", "Это \\\u2060N обычный текст"),
        ("Первая строка\nВторая строка", r"Первая строка\NВторая строка"),
        ("а\r\nб\rв", r"а\Nб\Nв"),
    ],
)
def test_escape_text(text, expected):
    assert escape_text(text) == expected


@pytest.mark.parametrize("value", [None, 123])
def test_escape_text_rejects_non_string(value):
    with pytest.raises(TypeError):
        escape_text(value)


@pytest.mark.parametrize(
    ("milliseconds", "expected"),
    [
        (0, "0:00:00.00"),
        (99, "0:00:00.09"),
        (100, "0:00:00.10"),
        (999, "0:00:00.99"),
        (1000, "0:00:01.00"),
        (59999, "0:00:59.99"),
        (60000, "0:01:00.00"),
        (3600000, "1:00:00.00"),
    ],
)
def test_format_timestamp(milliseconds, expected):
    """Проверить формат и отбрасывание остатка миллисекунд."""
    assert format_timestamp(milliseconds) == expected


def test_rejects_negative_time():
    """Отрицательное время недопустимо."""
    with pytest.raises(ValueError):
        format_timestamp(-1)


@pytest.mark.parametrize("value", [1.5, "1000", True, None])
def test_rejects_wrong_type(value):
    """Принимать только целое число, включая запрет bool."""
    with pytest.raises(TypeError):
        format_timestamp(value)


def test_preserves_minimum_interval():
    """После преобразования интервал 100 мс остаётся длиной 100 мс."""
    assert format_timestamp(1001) == "0:00:01.00"
    assert format_timestamp(1101) == "0:00:01.10"


def test_build_ass_header_and_style():
    spec = RenderSpec("brat", 5000, (LyricLine("1", "Привет", 0, 1000),))
    rows = build_ass(spec).splitlines()

    assert rows[:5] == [
        "[Script Info]",
        "ScriptType: v4.00+",
        "PlayResX: 720",
        "PlayResY: 1280",
        "WrapStyle: 2",
    ]
    index = rows.index("[V4+ Styles]")
    fields = rows[index + 1].removeprefix("Format: ").split(", ")
    values = rows[index + 2].removeprefix("Style: ").split(",")
    style = dict(zip(fields, values, strict=True))
    assert style["Name"] == "Default"
    assert style["Fontname"] == "DejaVu Sans"
    assert style["PrimaryColour"] == "&H00000000"
    assert style["Alignment"] == "5"
    assert (style["MarginL"], style["MarginR"], style["MarginV"]) == ("64", "64", "36")
    assert rows[rows.index("[Events]") + 1] == (
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"
    )


def test_build_ass_adjacent_lines_and_pause():
    spec = RenderSpec(
        "brat",
        5000,
        (
            LyricLine("1", "Раз", 0, 1234),
            LyricLine("2", "Два", 1234, 2500),
            LyricLine("3", "Три, четыре", 3000, 5000),
        ),
    )
    events = [row for row in build_ass(spec).splitlines() if row.startswith("Dialogue:")]
    assert events == [
        "Dialogue: 0,0:00:00.00,0:00:01.23,Default,,0,0,0,,Раз",
        "Dialogue: 0,0:00:01.23,0:00:02.50,Default,,0,0,0,,Два",
        "Dialogue: 0,0:00:03.00,0:00:05.00,Default,,0,0,0,,Три, четыре",
    ]


def test_build_ass_wraps_and_escapes_in_one_event():
    word = "Ж" * 10
    raw_text = word + " " + word + "\n" + r"{\b1} и \N"
    spec = RenderSpec("brat", 5000, (LyricLine("1", raw_text, 1000, 2500),))
    rows = build_ass(spec).splitlines()
    assert rows[rows.index("[Events]") + 2 :] == [
        f"Dialogue: 0,0:00:01.00,0:00:02.50,Default,,0,0,0,,{word}"
        + r"\N"
        + word
        + r"\N"
        + "\\{\\\u2060b1\\} и \\\u2060N"
    ]


def test_build_ass_rejects_invalid_spec():
    spec = RenderSpec("brat", 5000, (LyricLine("1", "За пределами", 4000, 6000),))
    with pytest.raises(RenderValidationError) as error:
        build_ass(spec)
    assert error.value.field == "lines[0].end_ms"
