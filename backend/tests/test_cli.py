from pathlib import Path

from renderer import cli

FIXTURES = Path(__file__).resolve().parents[2] / "tests" / "fixtures"


def test_cli_rejects_malformed_snapshot(tmp_path, monkeypatch, capsys):
    spec = tmp_path / "broken.json"
    spec.write_text("{", encoding="utf-8")
    output = tmp_path / "result.mp4"
    monkeypatch.setattr(cli.sys, "argv", ["renderer.cli", str(spec), "audio.wav", str(output)])

    assert cli.main() == 2
    captured = capsys.readouterr()
    assert captured.out == ""
    assert "Ошибка входных данных" in captured.err
    assert not output.exists()


def test_cli_reports_ffmpeg_failure(tmp_path, monkeypatch, capsys):
    spec = FIXTURES / "render-spec.json"
    output = tmp_path / "result.mp4"
    monkeypatch.setattr(cli.sys, "argv", ["renderer.cli", str(spec), "audio.wav", str(output)])

    def fail_render(*args):
        raise cli.FFmpegError("FFmpeg не найден")

    monkeypatch.setattr(cli, "render_video", fail_render)

    assert cli.main() == 1
    captured = capsys.readouterr()
    assert captured.out == ""
    assert "FFmpeg не найден" in captured.err
    assert not output.exists()
