"""Сборка ASS-субтитров из строк песни и их таймингов."""

from PIL import ImageFont

from renderer.models import RenderSpec
from renderer.validation import validate_spec

FONT_NAME = "DejaVu Sans"
FONT_SIZE = 48
FRAME_WIDTH, FRAME_HEIGHT = 720, 1280
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
                paragraph = paragraph[space + 1 :]
            else:
                lines.append(paragraph[: end - 1])
                paragraph = paragraph[end - 1 :]
            if not paragraph:
                break
    return "\n".join(lines)


def build_ass(spec: RenderSpec) -> str:
    """Собрать текст ASS-документа с одним событием на строку песни."""
    validate_spec(spec)

    rows = [
        "[Script Info]",
        "ScriptType: v4.00+",
        f"PlayResX: {FRAME_WIDTH}",
        f"PlayResY: {FRAME_HEIGHT}",
        "WrapStyle: 2",
        "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, "
        "OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, "
        "ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, "
        "Alignment, MarginL, MarginR, MarginV, Encoding",
        f"Style: Default,{FONT_NAME},{FONT_SIZE},&H00000000,&H00000000,"
        "&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,"
        f"5,{MARGIN_X},{MARGIN_X},{MARGIN_Y},1",
        "",
        "[Events]",
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ]

    max_width = FRAME_WIDTH - 2 * MARGIN_X
    for line in spec.lines:
        start = format_timestamp(line.start_ms)
        end = format_timestamp(line.end_ms)
        wrapped = wrap_text(line.text, max_width, FONT_SIZE)
        text = escape_text(wrapped)
        rows.append(f"Dialogue: 0,{start},{end},Default,,0,0,0,,{text}")

    return "\n".join(rows)
