import pytest

from renderer.ass import escape_text, format_timestamp, wrap_text


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
    assert all(len(line) < 24 for line in lines)


@pytest.mark.parametrize(("text", "width"), [("Ж", 1), ("строка\n" * 30, 500)])
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
