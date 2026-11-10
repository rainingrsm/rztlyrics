# Python backend: стартовая точка

Это **каркас**, а не готовая нулевая версия. Работают запуск FastAPI, `/api/v1/health`,
`/api/v1/version`, OpenAPI, схемы и проверка таймингов. Все продуктовые HTTP-маршруты
возвращают `501 NOT_IMPLEMENTED`; функции в `services/` и `tasks/render_job.py` явно
бросают `NotImplementedError`. Они не создают проекты, сессии, очередь или видео.

Python 3.12; зависимости фиксирует `uv.lock`. Команды выполняются из `backend/`:

```powershell
uv sync --frozen
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

OpenAPI: http://localhost:8000/api/docs. Миграция создаёт настоящие таблицы SQLite,
но API пока с ними не работает. Локальные данные: `../data/`; Docker использует `/data`.
Конфигурация читается из переменных окружения; локальный Python не загружает `.env`
автоматически. Для стандартного локального запуска достаточно значений по умолчанию.

## Где писать код

| Область | Владелец | Сначала реализовать |
|---|---|---|
| `api/projects.py`, `services/projects.py`, `services/sessions.py` | B1 | Проект, cookie, проверка владельца |
| `api/uploads.py`, `services/audio.py` | B1 | Потоковая загрузка, ffprobe, ограничения, Range |
| `schemas/`, `models/`, `migrations/` | B1 | Согласовать DTO с F2/A2 и сохранение черновика |
| `api/renders.py`, `services/renders.py` | B2 | Snapshot, атомарный active job, Redis/RQ |
| `tasks/render_job.py`, `api/jobs.py` | B2 | Адаптер renderer, состояния, готовый MP4 |
| `services/cleanup.py` | B2 | Очистка через 24 часа и восстановление после сбоя |
| `renderer/` | A1 + A2 | Чистая функция рендера без HTTP/Redis |

`TODO B1-*` и `TODO B2-*` в docstrings описывают входы, результат и проверку.
Это метки работ, а не номера существующих GitHub issues. Обработчик `not_implemented`
заменяйте вызовом сервисной функции только после её реализации и тестов.

Время передаётся целыми миллисекундами, `null` разрешён в черновике. Перед render:
1-100 строк, 1-120 символов, интервалы не короче 100 мс, без пересечений и внутри
аудио длиной 5000-60000 мс. Полная проверка файла и владения - будущая работа B1.

## Проверки

```powershell
uv run ruff check .
uv run ruff format --check .
uv run pytest
uv run alembic check
```

`alembic check` выполнять после `alembic upgrade head`. RQ worker работает в Linux:
`python -m app.tasks.worker` или Docker Compose из корня. Этот процесс уже умеет
ожидать очередь `renders`, но продуктовый обработчик рендера ещё не реализован.
Зелёные текущие тесты означают исправный каркас, а не готовность сквозного сценария.
