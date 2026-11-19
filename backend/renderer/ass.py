"""A1: будущий сериализатор ASS; пользовательский текст не является ASS-кодом."""

from PIL import ImageFont

from renderer.models import RenderSpec

FONT_NAME = "DejaVu Sans"
FRAME_WIDTH, FRAME_HEIGHT = 1280, 720
MARGIN_X, MARGIN_Y = 64, 36


def format_timestamp(ms: int) -> str:
    """Перевести миллисекунды в H:MM:SS.cc, отбрасывая остаток меньше 10 мс."""
    if type(ms) is not int:
        raise TypeError("Время должно быть целым числом миллисекунд")
    if ms < 0:
        raise ValueError("Время не может быть отрицательным")

    cs = ms // 10  # отбрасываем остаток меньше 10 мс
    seconds, cs = divmod(cs, 100)
    minutes, seconds = divmod(seconds, 60)
    hours, minutes = divmod(minutes, 60)

    return f"{hours}:{minutes:02}:{seconds:02}.{cs:02}"


def escape_text(text: str) -> str:
    """Подготовить пользовательский текст для поля Text в ASS."""
    if not isinstance(text, str):
        raise TypeError("Текст должен быть строкой")

    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Невидимый WORD JOINER отделяет буквальный слеш от следующего символа.
    return text.translate(str.maketrans({"\\": "\\\u2060", "{": r"\{", "}": r"\}", "\n": r"\N"}))


def wrap_text(text: str, max_width_px: int, font_size: int) -> str:
    """Перенести обычный текст до вызова escape_text, сохранив явные переносы."""
    if not isinstance(text, str):
        raise TypeError("Текст должен быть строкой")
    if type(max_width_px) is not int or type(font_size) is not int:
        raise TypeError("Ширина и размер шрифта должны быть целыми числами")
    if max_width_px <= 0 or font_size <= 0:
        raise ValueError("Ширина и размер шрифта должны быть положительными")

    font = ImageFont.truetype("DejaVuSans.ttf", font_size)
    width = min(max_width_px, FRAME_WIDTH - 2 * MARGIN_X)
    max_lines = (FRAME_HEIGHT - 2 * MARGIN_Y) // sum(font.getmetrics())
    lines = []
    for paragraph in text.replace("\r\n", "\n").replace("\r", "\n").split("\n"):
        while True:
            if len(lines) >= max_lines:
                raise ValueError("Текст не помещается по высоте в безопасную область кадра")
            for end in range(1, len(paragraph) + 1):
                left, _, right, _ = font.getbbox(paragraph[:end])
                if right - left > width:
                    break
            else:
                lines.append(paragraph)
                break

            if end == 1:
                raise ValueError("Символ не помещается по ширине в безопасную область кадра")
            space = paragraph.rfind(" ", 1, end)
            if space > 0:
                lines.append(paragraph[:space])
                paragraph = paragraph[space + 1:]
            else:
                lines.append(paragraph[:end - 1])
                paragraph = paragraph[end - 1:]
            if not paragraph:
                break
    return "\n".join(lines)


def build_ass(spec: RenderSpec) -> str:
    """TODO A1: собрать UTF-8 ASS для 1280x720, чёрного текста по центру.

    Вход сначала проверить validate_spec. Использовать закреплённый шрифт
    с кириллицей, интервалы [start,end), в паузах показывать только фон.
    A2 проверяет соседние строки, паузы и попадание текста в безопасные поля.
    """
    raise NotImplementedError("A1: реализовать ASS-документ")
