"""A1: точка входа для B2/worker; без импорта HTTP, БД или Redis."""

from pathlib import Path

from renderer.models import RenderResult, RenderSpec
from renderer.validation import validate_spec


def render_video(spec: RenderSpec, audio_path: Path, output_path: Path) -> RenderResult:
    """TODO A1: превратить неизменяемый снимок и аудио в проверенный MP4.

    1. Проверить spec и реальное аудио с A2; подготовить каталог конкретного job.
    2. Создать ASS и временный MP4; вызвать FFmpeg с ограничением времени.
    3. Через ffprobe подтвердить H.264/AAC, 1280x720, длину с допуском 200 мс.
    4. Атомарно переименовать проверенный файл в output_path, вернуть RenderResult.
    5. При сбое убрать только свои временные файлы; исключение обрабатывает worker.

    Приёмка A2+B2: слышен звук, кириллица читается, отклонение времени <=100 мс,
    паузы пустые, повтор после сбоя возможен. Сейчас MP4 не создаётся.
    """
    validate_spec(spec)
    raise NotImplementedError("A1: рендер видео ещё не реализован; готов только контракт")
