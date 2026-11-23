# Renderer: Андрей (A1) + Татьяна (A2)

`render_video` и CLI создают Brat MP4 по аудио и вручную заданным таймингам.
Для запуска нужны FFmpeg с libass, H.264/AAC, ffprobe и шрифт DejaVu Sans.

## Граница с backend

```python
from pathlib import Path
from renderer import LyricLine, RenderSpec, render_video

spec = RenderSpec("brat", 10_000, (LyricLine("line-1", "Проверяем текст", 0, 2_000),))
result = render_video(spec, Path("audio.wav"), Path("result.mp4"))
```

B2 передаёт снимок задания и внутренние пути. Renderer ничего не знает о cookie,
пользователях, HTTP, SQLite и Redis. `RenderResult` содержит `path`, `duration_ms`,
`width`, `height`, `elapsed_seconds`; путь не отправляется браузеру.

Снимок имеет `style`, `duration_ms`, `lines`; строка имеет уникальный `id`, `text`,
`start_ms`, `end_ms`. Для готового рендера времена целые и не равны null.
Валидация проверяет 5..60 с, 1..100 строк по 120 символов, минимальный интервал
100 мс, порядок и отсутствие пересечений. Смежные интервалы допустимы.

## Проверка и публикация

1. `render_video` проверяет снимок и аудио через `validate_spec` и `validate_audio`.
2. `build_ass` собирает субтитры, `run_ffmpeg` создаёт временный MP4 с лимитом 240 с.
3. `probe_media` подтверждает кодеки, размер кадра и длительность. После проверки
   `render_video` атомарно заменяет итоговый файл, то есть одним переименованием.
   При сбое временные файлы удаляются, предыдущий итоговый файл сохраняется.

Цель: MP4 H.264/AAC, 1280x720, 30 fps, yuv420p, faststart, фон #8ace00.
Допуск длительности 200 мс, времени появления строки 100 мс.
60 секунд за 3 минуты - целевой ориентир, пока не измеренный результат.

## Локальная проверка рендера

Из корня репозитория после установки backend:

```powershell
python tests/fixtures/generate_tone.py tests/fixtures/tone.wav
cd backend
uv run python -m renderer.cli ../tests/fixtures/render-spec.json ../tests/fixtures/tone.wav ../data/example.mp4
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate -of json ../data/example.mp4
```

CLI возвращает **0** и печатает путь к MP4. Ожидаемые параметры тестового MP4
следующие — 10 с, H.264/AAC, 1280×720, 30 fps. Для проверки входных данных замените
`render-spec.json` на `invalid-overlap.json`. CLI вернёт **2** и сообщит о
пересечении строк. Сбой FFmpeg, ffprobe или записи результата даёт код **1**.

`future/` описывает только следующие этапы: распознавание и автоматическую разметку.
