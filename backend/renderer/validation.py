"""A2: общие ограничения ручного сценария; проверяются до запуска FFmpeg."""

from renderer.models import RenderSpec

MIN_DURATION_MS = 5_000
MAX_DURATION_MS = 60_000
MAX_AUDIO_BYTES = 20 * 1024 * 1024
MAX_LINES = 100
MAX_TEXT_LENGTH = 120
MAX_LINE_ID_LENGTH = 64
MIN_LINE_DURATION_MS = 100


class RenderValidationError(ValueError):
    """Ожидаемая ошибка данных с полем для сообщения пользователю."""

    def __init__(self, field: str, message: str) -> None:
        super().__init__(message)
        self.field = field


def validate_spec(spec: RenderSpec) -> None:
    """A2: проверить готовый снимок; при ошибке вернуть поле через исключение.

    Проверка реализована. B1 обязан также проверять черновик своим DTO.
    Здесь неизвестные времена, пустой список и пересечения запрещены.
    Интервалы полуоткрытые [start_ms, end_ms): смежные строки допустимы.
    """
    if spec.style != "brat":
        raise RenderValidationError("style", "В v0 поддерживается только стиль brat.")
    if type(spec.duration_ms) is not int or not (
        MIN_DURATION_MS <= spec.duration_ms <= MAX_DURATION_MS
    ):
        raise RenderValidationError("duration_ms", "Длительность должна быть от 5000 до 60000 мс.")
    if not 1 <= len(spec.lines) <= MAX_LINES:
        raise RenderValidationError("lines", "Нужно от 1 до 100 строк.")

    previous_end = 0
    identifiers: set[str] = set()
    for index, line in enumerate(spec.lines):
        prefix = f"lines[{index}]"
        if (
            not isinstance(line.id, str)
            or not line.id.strip()
            or len(line.id) > MAX_LINE_ID_LENGTH
            or line.id in identifiers
        ):
            raise RenderValidationError(
                f"{prefix}.id",
                "ID строки должен быть непустым, уникальным и не длиннее 64 символов.",
            )
        identifiers.add(line.id)
        if not isinstance(line.text, str) or not line.text.strip():
            raise RenderValidationError(f"{prefix}.text", "Строка не должна быть пустой.")
        if len(line.text) > MAX_TEXT_LENGTH:
            raise RenderValidationError(f"{prefix}.text", "В строке допускается до 120 символов.")
        if type(line.start_ms) is not int or type(line.end_ms) is not int:
            raise RenderValidationError(f"{prefix}.start_ms", "Начало и конец задаются целыми мс.")
        if line.start_ms < previous_end:
            raise RenderValidationError(
                f"{prefix}.start_ms", "Строки должны идти по времени без пересечений."
            )
        if line.end_ms - line.start_ms < MIN_LINE_DURATION_MS:
            raise RenderValidationError(
                f"{prefix}.end_ms", "Интервал должен быть не короче 100 мс."
            )
        if line.end_ms > spec.duration_ms:
            raise RenderValidationError(f"{prefix}.end_ms", "Строка выходит за длительность аудио.")
        previous_end = line.end_ms
