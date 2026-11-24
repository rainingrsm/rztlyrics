# RZT Lyrics

Веб-сервис для создания короткого lyrics-видео: загрузить трек, ввести текст,
вручную расставить время строк, выбрать оформление и получить MP4.
Основная аудитория - музыканты и фанаты, которым нужен музыкальный проморолик.

**Автономный рендер Brat работает через CLI.** Запускаются оболочка React, FastAPI,
OpenAPI и проверки данных. Форма загрузки подключена к API. Бизнес-маршруты пока
возвращают `501 NOT_IMPLEMENTED`, вызов рендера из worker предстоит подключить.

## С чего начать

1. [Первые действия](docs/start-here.md) - порядок первого дня.
2. [GitHub для каждого участника](docs/github.md) - настройка, ветки, команды, PR и релиз.
3. [Команда](docs/team.md) и [этапы до конца декабря](docs/roadmap.md).
4. Откройте свой подробный план: [frontend](docs/tasks/frontend.md),
   [backend](docs/tasks/backend.md), [алгоритм и QA](docs/tasks/algorithm-qa.md).
5. [План команды в PDF](output/pdf/rzt-team-guide.pdf) содержит эти инструкции для чтения вне GitHub.

## Что войдёт в v0

MP3/WAV → текст и ручные тайминги → один стиль Brat → генерация → просмотр/скачивание.
Предложенные лимиты: 20 MiB, аудио 5-60 секунд, 1-100 строк по 120 символов.
Время в API - целые миллисекунды; null разрешён в черновике. Для рендера интервалы
не короче 100 мс, без пересечений и внутри аудио. Выход — вертикальный MP4 9:16,
720×1280, 30 fps, H.264/AAC.
Renderer применяет эти ограничения при локальной генерации. Подключение проверки к
загрузке аудио входит в задачи B1.

Распознавание, автоматическая разметка, картинки, Google-стиль, эффекты и nightcore
относятся к следующим этапам. [Объём и происхождение решений](docs/scope.md).

## Стек и структура

React + TypeScript + Vite; Python 3.12 + FastAPI/Pydantic; SQLite + SQLAlchemy/Alembic;
RQ/Redis; FFmpeg/ASS; Docker Compose/Caddy. C# backend из презентации заменён Python.
TypeScript выбран для общего контракта, дополнительный state manager не требуется.

```text
rztlyrics/
  frontend/
    src/app/                 маршруты и оболочка (F1)
    src/features/upload/     загрузка (F1)
    src/features/editor/     текст, аудио, тайминги (F2)
    src/features/render/     статус и MP4 (F1)
    src/shared/              API-клиент, DTO, UI, лимиты
  backend/
    app/api/                 HTTP-маршруты (B1/B2)
    app/schemas/             DTO и проверка данных (B1)
    app/models/              ORM-модели (B1)
    app/services/            проекты, аудио, сессии, jobs, очистка
    app/tasks/               RQ worker и обработчик задания (B2)
    renderer/                ASS, FFmpeg, render_video (A1/A2)
    renderer/future/         точки расширения ASR/align после v0
    migrations/              начальная миграция Alembic
    tests/                   проверки API/DTO/renderer-контракта
    pyproject.toml, uv.lock   Python-зависимости
  tests/fixtures/            JSON и генератор технического WAV
  tests/e2e/                 инструкция для будущего Playwright
  infra/                     Dockerfile, Caddyfile
  .github/                   CI, шаблоны issue/PR, CODEOWNERS
  docs/tasks/                подробные задания по функциям
  output/pdf/                план команды
  compose.yaml               локальные web/api/worker/redis
```

## Кто за что отвечает

| Участник | Роль | Основная часть |
| --- | --- | --- |
| Илья Константиновский | F1 | Загрузка, общие компоненты, статус и результат |
| Леонид Артюшенко | F2 | Редактор текста/таймингов и сохранение |
| Руслана Любимова | B1 | API, данные, сессии, аудио и draft |
| Варвара Ерёмина | B2 | Очередь, worker, файлы, Docker/CI и интеграция |
| Андрей Паратюкевич | A1 | ASS, FFmpeg и render_video |
| Татьяна Богачева | A2 + QA | Валидация, ffprobe, fixtures, регрессия |

QA - дополнительная роль Татьяны. Её код проверяют Андрей/Руслана, сквозной сценарий -
также Леонид. Каждый разработчик отвечает за проверки своей функции.

## Локально без Docker: посмотреть каркас

Установите Git, Python 3.12, uv 0.13.7, Node 22 (не ниже 22.13) и npm.
При установленном Python: `py -3.12 -m pip install uv==0.13.7`, затем откройте новый терминал.
Официальные инструкции: [Python](https://www.python.org/downloads/),
[Node.js](https://nodejs.org/en/download), [uv](https://docs.astral.sh/uv/getting-started/installation/).
Зависимости фиксируются в `frontend/package-lock.json` и `backend/uv.lock`.

Первый терминал, из корня проекта:

```powershell
cd backend
uv sync --frozen
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Второй терминал, из корня проекта:

```powershell
cd frontend
npm ci
npm run dev
```

UI: http://localhost:5173. API: http://localhost:8000/api/docs.
Проверка процесса: http://localhost:8000/api/v1/health.
Vite проксирует /api на localhost:8000. Локальная БД появляется в `data/` и не входит в Git.
Python читает переменные окружения, а не корневой .env автоматически; defaults достаточны
для каркаса. Очередь этим способом не запускается; для worker используйте Linux Docker.

## Docker Compose: общее окружение команды

Нужен Docker Desktop с Linux containers и Compose v2. В этой среде Docker недоступен,
поэтому конфигурация подготовлена, но сборка контейнеров ещё не подтверждена.
Её первый полный запуск - задача B2-01.

Из корня, `.env` создайте один раз, не перезаписывая свои существующие настройки:

```powershell
Copy-Item .env.example .env
docker compose config
docker compose build
docker compose run --rm api uv run --no-sync alembic upgrade head
docker compose up -d
docker compose ps
docker compose logs --tail=50 api worker
```

UI http://localhost:8080, OpenAPI http://localhost:8080/api/docs.
Сейчас открываются только каркас и документация. Полный MP4-сценарий появится после
реализации задач. `.env.example` содержит только локальные значения, без секретов.
После изменения Python: `docker compose up -d --build api worker`.
Остановка: `docker compose down`. Не добавляйте `-v`: данные должны сохраняться.
Публичный стенд и HTTPS - отдельный этап, адрес пока не назначен.

## Проверки перед PR

```powershell
cd frontend
npm ci
npm run lint
npm run test -- --run
npm run build
cd ../backend
uv sync --frozen
uv run ruff check .
uv run ruff format --check .
uv run pytest
uv run alembic upgrade head
uv run alembic check
cd ..
```

Текущий CI повторяет frontend/backend проверки на Linux. Автономный рендер проверяется
командами ниже. Добавление FFmpeg smoke и браузерного теста Playwright в CI остаётся в плане.
[Результат проверки каркаса](docs/scaffold-verification.md) и [будущая приёмка](docs/test-plan.md).

Проверка автономного рендера на техническом WAV из `backend/`.
Команды `ffmpeg` и `ffprobe` должны быть в PATH, а DejaVu Sans установлен.

```powershell
uv run python ../tests/fixtures/generate_tone.py ../tests/fixtures/tone.wav
uv run python -m renderer.cli ../tests/fixtures/render-spec.json ../tests/fixtures/tone.wav ../data/example.mp4
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate -of json ../data/example.mp4
```

CLI печатает `../data/example.mp4` с системными разделителями пути и возвращает код 0.
Ожидается вертикальный MP4 длительностью 10 секунд с H.264/AAC, 720×1280 и 30 fps.
Для повторной проверки используйте уже созданный WAV. Для демо понадобится вокальная запись.

## Документы и выпуск

[API](docs/api.md), [архитектура](docs/architecture.md), [backlog](docs/backlog.md),
[правила работы](CONTRIBUTING.md), [тест-отчёт](docs/test-report.md), [демо](docs/demo.md),
[материалы и лицензии](LICENSE.md). Условия использования собственного кода команда ещё выбирает.
Целевой релиз v0.0.1 - 27 декабря 2026, резерв до конца декабря. Release и стенд пока не созданы.
