import pytest

from renderer.ass import format_timestamp


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
