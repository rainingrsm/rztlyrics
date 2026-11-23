"""A1: точка входа для B2/worker; без импорта HTTP, БД или Redis."""

from pathlib import Path
from tempfile import TemporaryDirectory
from time import perf_counter

from renderer.ass import FRAME_HEIGHT, FRAME_WIDTH, build_ass
from renderer.ffmpeg import build_command, probe_media, run_ffmpeg, validate_audio
from renderer.models import RenderResult, RenderSpec
from renderer.validation import validate_spec

DURATION_TOLERANCE_MS = 200


class RenderError(RuntimeError):
    """Временный MP4 не прошёл проверку перед публикацией."""


def render_video(spec: RenderSpec, audio_path: Path, output_path: Path) -> RenderResult:
    """Создать MP4 из снимка и опубликовать результат после проверки."""
    started_at = perf_counter()
    validate_spec(spec)
    audio_path = audio_path.resolve()
    if audio_path == output_path.resolve():
        raise ValueError("Пути к исходному аудио и итоговому видео должны различаться")
    validate_audio(audio_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Keep temporary files together on the same filesystem for atomic publication.
    with TemporaryDirectory(prefix=".render-", dir=output_path.parent) as directory:
        workdir = Path(directory)
        subtitles = workdir / "lyrics.ass"
        video = workdir / "result.mp4"
        subtitles.write_text(build_ass(spec), encoding="utf-8")
        run_ffmpeg(build_command(spec, audio_path, subtitles, video))

        media = probe_media(video)
        if (media.video_codec, media.audio_codec) != ("h264", "aac"):
            raise RenderError("Готовое видео должно содержать потоки H.264 и AAC")
        if (media.width, media.height) != (FRAME_WIDTH, FRAME_HEIGHT):
            raise RenderError(f"Ожидалось разрешение {FRAME_WIDTH}x{FRAME_HEIGHT}")
        if abs(media.duration_ms - spec.duration_ms) > DURATION_TOLERANCE_MS:
            raise RenderError(f"Длительность видео отличается от снимка: {media.duration_ms} мс")

        video.replace(output_path)

    return RenderResult(
        path=output_path,
        duration_ms=media.duration_ms,
        width=FRAME_WIDTH,
        height=FRAME_HEIGHT,
        elapsed_seconds=perf_counter() - started_at,
    )
