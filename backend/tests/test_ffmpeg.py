import json
import subprocess

import pytest

from renderer import ffmpeg
from renderer.models import LyricLine, RenderSpec


def test_probe_media_returns_audio_info(tmp_path, monkeypatch):
    audio_file = tmp_path / "test.mp3"
    audio_file.write_bytes(b"fake audio")

    ffprobe_result = {
        "streams": [{"codec_type": "audio", "codec_name": "mp3"}],
        "format": {"duration": "10.5", "format_name": "mp3"},
    }

    def fake_run(*args, **kwargs):
        return ffmpeg.subprocess.CompletedProcess(
            args=args, returncode=0, stdout=json.dumps(ffprobe_result), stderr=""
        )

    monkeypatch.setattr(ffmpeg.subprocess, "run", fake_run)

    result = ffmpeg.probe_media(audio_file)

    assert result.duration_ms == 10500
    assert result.audio_codec == "mp3"
    assert result.container_format == "mp3"


def test_probe_media_raises_error_when_ffprobe_fails(tmp_path, monkeypatch):
    audio_file = tmp_path / "broken.mp3"
    audio_file.write_bytes(b"fake audio")

    def fake_run(*args, **kwargs):
        return ffmpeg.subprocess.CompletedProcess(
            args=args, returncode=1, stdout="", stderr="Invalid data"
        )

    monkeypatch.setattr(ffmpeg.subprocess, "run", fake_run)

    with pytest.raises(ffmpeg.MediaProbeError):
        ffmpeg.probe_media(audio_file)


def test_probe_media_raises_error_on_timeout(tmp_path, monkeypatch):
    audio_file = tmp_path / "test.mp3"
    audio_file.write_bytes(b"fake audio")

    def fake_run(*args, **kwargs):
        raise subprocess.TimeoutExpired(cmd=args[0], timeout=kwargs.get("timeout", 15))

    monkeypatch.setattr(ffmpeg.subprocess, "run", fake_run)

    with pytest.raises(ffmpeg.MediaProbeError):
        ffmpeg.probe_media(audio_file)


def test_validate_audio_raises_error_when_file_not_found(tmp_path):
    audio_file = tmp_path / "missing.mp3"

    with pytest.raises(ffmpeg.AudioValidationError) as error:
        ffmpeg.validate_audio(audio_file)

    assert error.value.code == "file_not_found"


def test_validate_audio_raises_error_when_file_too_large(tmp_path, monkeypatch):
    audio_file = tmp_path / "large.mp3"
    audio_file.write_bytes(b"x" * 11)

    monkeypatch.setattr(ffmpeg, "MAX_AUDIO_BYTES", 10)

    with pytest.raises(ffmpeg.AudioValidationError) as error:
        ffmpeg.validate_audio(audio_file)

    assert error.value.code == "file_too_large"


def test_build_command_keeps_media_paths_and_lyrics_separate(tmp_path):
    audio = tmp_path / "input tone.wav"
    subtitles = tmp_path / "lyrics' [1], draft;.ass"
    output = tmp_path / "result video.mp4"
    lyrics = r"Слова, которых нет в аргументах {\pos(1,2)}"
    spec = RenderSpec("brat", 5_123, (LyricLine("a", lyrics, 0, 100),))

    command = ffmpeg.build_command(spec, audio, subtitles, output)

    assert command[0] == "ffmpeg"
    assert command[command.index("-i") + 1] == "color=c=0x8ace00:s=1280x720:r=30"
    assert str(audio.resolve()) in command
    assert command[-1] == str(output.resolve())
    assert command[command.index("-t") + 1] == "5123ms"
    assert command[command.index("-vf") + 1].startswith("ass=filename=")
    assert all(lyrics not in argument for argument in command)
    assert [command[index + 1] for index, value in enumerate(command) if value == "-map"] == [
        "0:v:0",
        "1:a:0",
    ]
    assert command[command.index("-c:v") + 1] == "libx264"
    assert command[command.index("-c:a") + 1] == "aac"
    assert command[command.index("-pix_fmt") + 1] == "yuv420p"
    assert command[command.index("-movflags") + 1] == "+faststart"
