"""B1 + F2 + A2: миллисекунды, правила черновика и проверка готовности к рендеру."""

from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, StrictInt, field_validator, model_validator

Milliseconds = Annotated[StrictInt, Field(ge=0)]


class LyricLine(BaseModel):
    """Одна строка. null означает ещё не заданное время; 0 является валидным началом."""

    model_config = ConfigDict(extra="forbid")
    id: str = Field(min_length=1, max_length=64)
    text: str = Field(min_length=1, max_length=120)
    start_ms: Milliseconds | None = None
    end_ms: Milliseconds | None = None

    @field_validator("id")
    @classmethod
    def reject_blank_id(cls, value: str) -> str:
        """Идентификатор может иметь 1-64 символа, но не состоять только из пробелов."""
        if not value.strip():
            raise ValueError("Идентификатор строки не должен быть пустым")
        return value

    @field_validator("text")
    @classmethod
    def reject_blank_text(cls, value: str) -> str:
        """Не сохранять пустую строку; внешние пробелы при этом сохраняются как текст."""
        if not value.strip():
            raise ValueError("Строка не должна состоять только из пробелов")
        return value

    @model_validator(mode="after")
    def validate_interval(self) -> "LyricLine":
        """Заданный полностью интервал должен быть длиной не менее 100 мс."""
        if self.start_ms is not None and self.end_ms is not None:
            if self.end_ms - self.start_ms < 100:
                raise ValueError("Интервал строки должен быть не короче 100 мс")
        return self


class LyricsUpdate(BaseModel):
    """Черновик может быть пустым или содержать строки без таймингов."""

    model_config = ConfigDict(extra="forbid")
    style: Literal["brat"] = "brat"
    lines: list[LyricLine] = Field(default_factory=list, max_length=100)

    @model_validator(mode="after")
    def validate_line_ids(self) -> "LyricsUpdate":
        """Повторы текста допустимы, идентификаторы строк обязаны различаться."""
        if len({line.id for line in self.lines}) != len(self.lines):
            raise ValueError("Идентификаторы строк должны быть уникальны")
        return self


class ProjectResponse(BaseModel):
    """DTO проекта; внутренние пути и идентификатор сессии не покидают backend."""

    id: UUID
    style: Literal["brat"] = "brat"
    duration_ms: int | None = None
    audio_url: str | None = None
    lines: list[LyricLine] = Field(default_factory=list)
    latest_job_id: UUID | None = None
    revision: int = Field(default=0, ge=0)


def validate_render_ready(draft: LyricsUpdate, duration_ms: int) -> None:
    """B1/A2: проверить полный draft перед snapshot; ValueError означает запрет рендера.

    Проверка duration источника через ffprobe и наличие аудиофайла относятся к services.audio.
    Полуоткрытые интервалы [start,end) допускают соприкасающиеся строки и паузы.
    """
    if type(duration_ms) is not int or not 5_000 <= duration_ms <= 60_000:
        raise ValueError("Длительность аудио должна составлять 5000-60000 мс")
    if not draft.lines:
        raise ValueError("Для рендера нужна хотя бы одна строка")
    previous_end = 0
    for index, line in enumerate(draft.lines):
        if line.start_ms is None or line.end_ms is None:
            raise ValueError(f"lines[{index}]: задайте начало и конец")
        if line.start_ms < previous_end:
            raise ValueError(f"lines[{index}].start_ms: строки пересекаются или нарушен порядок")
        if line.end_ms > duration_ms:
            raise ValueError(f"lines[{index}].end_ms: строка выходит за длительность аудио")
        previous_end = line.end_ms
