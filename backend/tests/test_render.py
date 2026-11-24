from pathlib import Path

import pytest

from renderer import render
from renderer.ffmpeg import FFmpegError, MediaInfo
from renderer.models import LyricLine, RenderSpec

SPEC = RenderSpec("brat", 5_000, (LyricLine("a", "Текст", 0, 100),))


@pytest.mark.parametrize("fails_during", ["ffmpeg", "codecs", "landscape"])
def test_failed_render_cleans_temporary_files_and_preserves_output(
    tmp_path, monkeypatch, fails_during
):
    output = tmp_path / "result.mp4"
    output.write_bytes(b"previous result")
    monkeypatch.setattr(render, "validate_audio", lambda path: None)

    def write_temporary_video(arguments):
        Path(arguments[-1]).write_bytes(b"temporary result")
        if fails_during == "ffmpeg":
            raise FFmpegError("FFmpeg failed")

    monkeypatch.setattr(render, "run_ffmpeg", write_temporary_video)
    media = (
        MediaInfo(5_000, "aac", "h264", 1280, 720)
        if fails_during == "landscape"
        else MediaInfo(5_000, "aac", "vp9", 720, 1280)
    )
    monkeypatch.setattr(render, "probe_media", lambda path: media)

    error = FFmpegError if fails_during == "ffmpeg" else render.RenderError
    with pytest.raises(error):
        render.render_video(SPEC, tmp_path / "audio.wav", output)

    assert output.read_bytes() == b"previous result"
    assert list(tmp_path.iterdir()) == [output]


def test_render_does_not_replace_source_audio(tmp_path):
    audio = tmp_path / "audio.wav"
    audio.write_bytes(b"source audio")

    with pytest.raises(ValueError, match="должны различаться"):
        render.render_video(SPEC, audio, audio)

    assert audio.read_bytes() == b"source audio"
