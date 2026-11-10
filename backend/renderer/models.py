"""A2: неизменяемый контракт renderer, согласуемый с B1/B2."""

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class LyricLine:
    """Строка со временем в целых миллисекундах; null допустим только в UI-черновике."""

    id: str
    text: str
    start_ms: int
    end_ms: int


@dataclass(frozen=True)
class RenderSpec:
    """Снимок задания: правка проекта после запуска не меняет эти данные."""

    style: str
    duration_ms: int
    lines: tuple[LyricLine, ...]


@dataclass(frozen=True)
class RenderResult:
    """Проверенный итог для worker; путь внутренний, API не отдаёт его клиенту."""

    path: Path
    duration_ms: int
    width: int
    height: int
    elapsed_seconds: float
