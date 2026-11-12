"""A1: будущий сериализатор ASS; пользовательский текст не является ASS-кодом."""

from renderer.models import RenderSpec


def format_timestamp(ms: int) -> str:
    """Перевести миллисекунды в H:MM:SS.cc, отбрасывая остаток меньше 10 мс."""
    if type(ms) is not int:
        raise TypeError("Время должно быть целым числом миллисекунд")
    if ms < 0:
        raise ValueError("Время не может быть отрицательным")

    cs = ms // 10  # округляем миллисекунды до сотых
    seconds, cs = divmod(cs, 100)
    minutes, seconds = divmod(seconds, 60)
    hours, minutes = divmod(minutes, 60)

    return f"{hours}:{minutes:02}:{seconds:02}.{cs:02}"


def escape_text(text: str) -> str:
    """TODO A1: сериализовать обычный текст без выполнения ASS-тегов.

    Проверить кириллицу, фигурные скобки, обратный слеш, кавычки и переносы.
    Не подставлять текст в команду оболочки или строку FFmpeg-фильтра.
    """
    raise NotImplementedError("A1: реализовать безопасный текст ASS")


def wrap_text(text: str, max_width_px: int, font_size: int) -> str:
    """TODO A1: переносить текст по измеренной ширине выбранного шрифта.

    A2 проверяет 120 символов и длинное слово: текст не обрезается.
    Если текст нельзя разместить в безопасной области, вернуть понятную ошибку.
    """
    raise NotImplementedError("A1: реализовать перенос строк")


def build_ass(spec: RenderSpec) -> str:
    """TODO A1: собрать UTF-8 ASS для 1280x720, чёрного текста по центру.

    Вход сначала проверить validate_spec. Использовать закреплённый шрифт
    с кириллицей, интервалы [start,end), в паузах показывать только фон.
    A2 проверяет соседние строки, паузы и попадание текста в безопасные поля.
    """
    raise NotImplementedError("A1: реализовать ASS-документ")
