"""A1/A2: заготовки взаимодействия с внешними ffmpeg/ffprobe."""

from dataclasses import dataclass
from pathlib import Path

from renderer.models import RenderSpec


@dataclass(frozen=True)
class MediaInfo:
    """Данные ffprobe; длительность не следует брать из имени файла или браузера."""

    duration_ms: int
    audio_codec: str | None
    video_codec: str | None
    width: int | None
    height: int | None


def probe_media(path: Path, timeout_seconds: int = 15) -> MediaInfo:
    """TODO A2: вызвать ffprobe с JSON-выводом и разобрать поток/длительность.

    Принимать Path, запускать список аргументов с shell=False, ставить timeout.
    Проверить повреждённый файл, отсутствие аудиопотока и ненулевой exit code.
    Код ошибки понятный, диагностический вывод ограниченный и без внешних путей в UI.
    """
    raise NotImplementedError("A2: реализовать ffprobe")


def validate_audio(path: Path) -> MediaInfo:
    """TODO A2: проверить размер <=20 MiB, реальный MP3/WAV и 5..60 секунд.

    Расширение/MIME недостаточны: подтвердить контейнер и поток через ffprobe.
    B1 вызывает после ограниченного по размеру сохранения upload; удаляет отказанный файл.
    """
    raise NotImplementedError("A2: реализовать проверку аудио")


def build_command(spec: RenderSpec, audio: Path, subtitles: Path, output: Path) -> list[str]:
    """TODO A1: вернуть argv для FFmpeg без запуска и без shell-строк.

    Фон #8ace00, 1280x720, 30 fps, libx264, AAC, yuv420p, +faststart.
    В фильтр передавать только сгенерированное безопасное имя ASS; Windows-пути
    требуют отдельной проверки экранирования. Фиксировать длину по duration_ms.
    """
    raise NotImplementedError("A1: собрать аргументы FFmpeg")


def run_ffmpeg(arguments: list[str], timeout_seconds: int = 240) -> None:
    """TODO A1: выполнить argv с shell=False, timeout и проверкой exit code.

    При timeout завершить дочерний процесс; короткий диагностический лог
    передать worker. Неполный MP4 не должен стать доступен через API.
    Timeout FFmpeg меньше job timeout RQ (300 с).
    """
    raise NotImplementedError("A1: реализовать контролируемый запуск FFmpeg")
