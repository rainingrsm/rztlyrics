"""Создание Brat MP4 из JSON-снимка и аудио без API и Redis."""

import argparse
import json
import sys
from pathlib import Path

from renderer.ffmpeg import FFmpegError, MediaProbeError
from renderer.models import LyricLine, RenderSpec
from renderer.render import RenderError, render_video


def main() -> int:
    """Прочитать снимок и запустить рендер."""
    parser = argparse.ArgumentParser(description="Создание Brat MP4 из JSON-снимка и аудио")
    parser.add_argument("spec", type=Path)
    parser.add_argument("audio", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    try:
        payload = json.loads(args.spec.read_text(encoding="utf-8"))
        spec = RenderSpec(
            style=payload["style"],
            duration_ms=payload["duration_ms"],
            lines=tuple(LyricLine(**line) for line in payload["lines"]),
        )
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(f"Ошибка входных данных: {error}", file=sys.stderr)
        return 2

    try:
        result = render_video(spec, args.audio, args.output)
    except ValueError as error:
        print(f"Ошибка входных данных: {error}", file=sys.stderr)
        return 2
    except (FFmpegError, MediaProbeError, OSError, RenderError) as error:
        print(f"Ошибка рендера: {error}", file=sys.stderr)
        return 1

    print(result.path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
