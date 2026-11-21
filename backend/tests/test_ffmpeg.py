import json
import pytest
import subprocess

from renderer import ffmpeg


def test_probe_media_returns_audio_info(tmp_path, monkeypatch):
    audio_file = tmp_path / "test.mp3"
    audio_file.write_bytes(b"fake audio")

    ffprobe_result = {
        "streams": [
            {
                "codec_type": "audio",
                "codec_name": "mp3"
            }
        ],
        "format": {
            "duration": "10.5",
            "format_name": "mp3"
        }
    }

    def fake_run(*args, **kwargs):
        return ffmpeg.subprocess.CompletedProcess(
            args=args,
            returncode=0,
            stdout=json.dumps(ffprobe_result),
            stderr=""
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
            args=args,
            returncode=1,
            stdout="",
            stderr="Invalid data"
        )

    monkeypatch.setattr(ffmpeg.subprocess, "run", fake_run)

    with pytest.raises(ffmpeg.MediaProbeError):
        ffmpeg.probe_media(audio_file)

def test_probe_media_raises_error_on_timeout(tmp_path, monkeypatch):
    audio_file = tmp_path / "test.mp3"
    audio_file.write_bytes(b"fake audio")

    def fake_run(*args, **kwargs):
        raise subprocess.TimeoutExpired(
            cmd=args[0],
            timeout=kwargs.get("timeout", 15)
        )

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