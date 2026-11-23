"""A1/A2: безопасная работа с внешними ffmpeg/ffprobe."""

from __future__ import annotations

import json
import subprocess
from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal, InvalidOperation
from pathlib import Path

from renderer.ass import FRAME_HEIGHT, FRAME_WIDTH
from renderer.models import RenderSpec
from renderer.validation import MAX_AUDIO_BYTES, MAX_DURATION_MS, MIN_DURATION_MS


class MediaProbeError(RuntimeError):
    """Не удалось получить сведения о медиафайле."""


class AudioValidationError(ValueError):
    """Аудиофайл не соответствует ограничениям загрузки."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code


@dataclass(frozen=True)
class MediaInfo:
    """Данные ffprobe."""

    duration_ms: int
    audio_codec: str | None
    video_codec: str | None
    width: int | None
    height: int | None
    container_format: str | None = None


def probe_media(path: Path, timeout_seconds: int = 15) -> MediaInfo:
    """Получить информацию о медиафайле через ffprobe."""

    if timeout_seconds <= 0:
        raise ValueError("Таймаут должен быть положительным")

    if not path.is_file():
        raise MediaProbeError("Медиафайл не найден")

    command = [
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "format=duration,format_name:stream=codec_type,codec_name,width,height,duration",
        "-of",
        "json",
        str(path),
    ]

    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
            check=False,
        )
    except FileNotFoundError as error:
        raise MediaProbeError("FFprobe не найден") from error
    except subprocess.TimeoutExpired as error:
        raise MediaProbeError("Время проверки файла истекло") from error
    except OSError as error:
        raise MediaProbeError("Не удалось запустить FFprobe") from error

    if result.returncode != 0:
        raise MediaProbeError("FFprobe не смог прочитать файл")

    try:
        data = json.loads(result.stdout)
    except json.JSONDecodeError as error:
        raise MediaProbeError("FFprobe вернул некорректный JSON") from error

    streams = data.get("streams", [])
    audio = next(
        (stream for stream in streams if stream.get("codec_type") == "audio"),
        None,
    )
    video = next(
        (stream for stream in streams if stream.get("codec_type") == "video"),
        None,
    )

    duration_value = data.get("format", {}).get("duration")

    if duration_value is None:
        durations = [
            stream.get("duration") for stream in streams if stream.get("duration") is not None
        ]
        duration_value = max(durations, key=Decimal) if durations else None

    if duration_value is None:
        raise MediaProbeError("Не удалось определить длительность файла")

    try:
        duration = Decimal(str(duration_value))
        if not duration.is_finite() or duration < 0:
            raise InvalidOperation
        duration_ms = int(
            (duration * 1000).quantize(
                Decimal("1"),
                rounding=ROUND_HALF_UP,
            )
        )
    except (InvalidOperation, ValueError) as error:
        raise MediaProbeError("Некорректная длительность файла") from error

    return MediaInfo(
        duration_ms=duration_ms,
        audio_codec=audio.get("codec_name") if audio else None,
        video_codec=video.get("codec_name") if video else None,
        width=video.get("width") if video else None,
        height=video.get("height") if video else None,
        container_format=data.get("format", {}).get("format_name"),
    )


def validate_audio(path: Path) -> MediaInfo:
    """Проверить аудиофайл перед загрузкой."""

    if not path.is_file():
        raise AudioValidationError("file_not_found", "Аудиофайл не найден")

    if path.stat().st_size > MAX_AUDIO_BYTES:
        raise AudioValidationError("file_too_large", "Размер аудиофайла превышает допустимый")

    media = probe_media(path)

    if media.audio_codec is None:
        raise AudioValidationError("audio_stream_missing", "В файле отсутствует аудиопоток")

    if media.container_format not in ("mp3", "wav"):
        raise AudioValidationError("unsupported_format", "Поддерживаются только MP3 и WAV")

    if not MIN_DURATION_MS <= media.duration_ms <= MAX_DURATION_MS:
        raise AudioValidationError("invalid_duration", "Длительность должна быть от 5 до 60 секунд")

    return media


def build_command(spec: RenderSpec, audio: Path, subtitles: Path, output: Path) -> list[str]:
    """Собрать аргументы FFmpeg для MP4 в стиле Brat."""
    # FFmpeg parses the filename option and the filter graph separately.
    filename = "'" + subtitles.resolve().as_posix().replace("'", r"'\''") + "'"
    subtitle_filter = "ass=filename='" + filename.replace("'", r"'\''") + "'"
    return [
        "ffmpeg",
        "-hide_banner",
        "-loglevel",
        "error",
        "-nostdin",
        "-n",
        "-f",
        "lavfi",
        "-i",
        f"color=c=0x8ace00:s={FRAME_WIDTH}x{FRAME_HEIGHT}:r=30",
        "-i",
        str(audio.resolve()),
        "-map",
        "0:v:0",
        "-map",
        "1:a:0",
        "-vf",
        subtitle_filter,
        "-t",
        f"{spec.duration_ms}ms",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-movflags",
        "+faststart",
        "-f",
        "mp4",
        str(output.resolve()),
    ]


def run_ffmpeg(arguments: list[str], timeout_seconds: int = 240) -> None:
    """TODO A1: выполнить argv с shell=False, timeout и проверкой exit code.

    При timeout завершить дочерний процесс; короткий диагностический лог
    передать worker. Неполный MP4 не должен стать доступен через API.
    Timeout FFmpeg меньше job timeout RQ (300 с).
    """
    raise NotImplementedError("A1: реализовать контролируемый запуск FFmpeg")
