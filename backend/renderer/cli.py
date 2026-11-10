"""CLI для будущей независимой проверки renderer, без запуска API/Redis."""

import argparse
import json
import sys
from pathlib import Path

from renderer.models import LyricLine, RenderSpec
from renderer.render import render_video


def main() -> int:
    """A1: прочитать JSON-снимок и вызвать renderer; незавершённость даёт код 3.

    Реализован вход CLI. После разработки render_video здесь останется тот же
    контракт; B2 сможет воспроизводить ошибки worker отдельно от сервера.
    """
    parser = argparse.ArgumentParser(description="RZT renderer (пока каркас)")
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
        if not args.audio.is_file():
            raise ValueError("Аудиофайл не найден; создайте fixture или передайте свой файл.")
        result = render_video(spec, args.audio, args.output)
    except NotImplementedError as error:
        print(str(error), file=sys.stderr)
        return 3
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(f"Ошибка входных данных: {error}", file=sys.stderr)
        return 2
    print(result.path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
