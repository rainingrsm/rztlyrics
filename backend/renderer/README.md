# Renderer: Андрей (A1) + Татьяна (A2)

Это каркас алгоритма, а не готовый генератор. Работают модели данных,
`validate_spec` и вход CLI. `render_video`, ASS и FFmpeg пока поднимают
`NotImplementedError`. Модели распознавания не установлены.

## Граница с backend

```python
from pathlib import Path
from renderer import LyricLine, RenderSpec, render_video

spec = RenderSpec("brat", 10_000, (LyricLine("line-1", "Проверяем текст", 0, 2_000),))
# После реализации A1; сейчас вызов завершается NotImplementedError.
result = render_video(spec, Path("audio.wav"), Path("result.mp4"))
```

B2 передаёт снимок задания и внутренние пути. Renderer ничего не знает о cookie,
пользователях, HTTP, SQLite и Redis. `RenderResult` содержит `path`, `duration_ms`,
`width`, `height`, `elapsed_seconds`; путь не отправляется браузеру.

Снимок имеет `style`, `duration_ms`, `lines`; строка имеет уникальный `id`, `text`,
`start_ms`, `end_ms`. Для готового рендера времена целые и не равны null.
Валидация проверяет 5..60 с, 1..100 строк по 120 символов, минимальный интервал
100 мс, порядок и отсутствие пересечений. Смежные интервалы допустимы.

## Порядок реализации

1. **A1**: `ass.py` - время, экранирование текста, переносы, документ ASS.
2. **A2**: `ffmpeg.py` - `probe_media`, `validate_audio`; граничные fixtures.
3. **A1**: аргументы и запуск FFmpeg, затем `render_video`; передать CLI B2.
4. **A2 + B2**: проверить настоящий файл, ошибки/timeout, повторы, измерить скорость.
5. **A2 + F1/F2**: сравнить показ строк в UI с MP4, зафиксировать результаты QA.

Цель: MP4 H.264/AAC, 1280x720, 30 fps, yuv420p, faststart, фон #8ace00.
Допуск длительности 200 мс, времени появления строки 100 мс.
60 секунд за 3 минуты - целевой ориентир, пока не измеренный результат.

## Локальная проверка контракта

Из корня репозитория после установки backend:

```powershell
python tests/fixtures/generate_tone.py tests/fixtures/tone.wav
cd backend
uv run python -m renderer.cli ../tests/fixtures/render-spec.json ../tests/fixtures/tone.wav ../data/example.mp4
```

В текущем каркасе CLI возвращает код **3**, сообщает о незавершённости и не создаёт
видео. Это ожидаемо, а не успешный тест рендера. Когда функция будет реализована,
код успеха будет 0; A2 добавит реальный интеграционный тест с ffprobe.

`future/` описывает только следующие этапы: распознавание и автоматическую разметку.
