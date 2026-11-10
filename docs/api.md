# Контракт v0

Префикс `/api/v1`, документация `/api/docs`, схема `/api/openapi.json`.
Сейчас product routes возвращают 501 `NOT_IMPLEMENTED`. Ниже целевые ответы;
реализованные типы описаны в backend/app/schemas и frontend/src/shared/types.

| Метод / путь после префикса | Успех | Исполнитель |
| --- | --- | --- |
| POST /projects | 201 Project | B1 |
| POST /projects/{id}/audio | 200 Project; multipart `file` | B1 |
| GET /projects/{id} | 200 Project | B1 |
| PUT /projects/{id}/lyrics | 200 Project; тело style+lines | B1 |
| GET /projects/{id}/audio | 200/206 аудио, Range | B1 |
| POST /projects/{id}/renders | 202 `{job_id,status:"queued"}` | B2 |
| GET /jobs/{id} | 200 Job | B2 |
| GET /jobs/{id}/video | 200/206 MP4; `?download=1` attachment | B2 |
| GET /health | 200, жив ли процесс API | B2 |
| GET /version | 200, версия/commit/stage | B2 |

Project: `id`, `style:"brat"`, `duration_ms:null|int`, `audio_url:null|string`,
`lines:LyricLine[]`, `latest_job_id:null|string`, `revision:int`.
Job: `id`, `project_id`, `status`, `video_url:null|string`, `error:null|ErrorDetail`.
Статусы: `queued → running → succeeded|failed`. ErrorDetail: `code`, `message`, `field` (может быть null).
URL возвращает API; клиент не собирает файловый путь.

```json
{
  "style": "brat",
  "lines": [
    {"id": "line-1", "text": "Проверяем первый кадр", "start_ms": 1000, "end_ms": 3500},
    {"id": "line-2", "text": "Здесь следующая строка", "start_ms": 4000, "end_ms": 7000}
  ]
}
```

Черновик может содержать пустой массив и null-тайминги. Полностью заданный интервал
проверяется при сохранении; перед рендером все интервалы обязательны. ID непустые,
не состоят только из пробелов, уникальны и не длиннее 64 символов;
повторяющийся текст разрешён. `0 ≤ start < end ≤ duration`, минимум 100 мс;
порядок массива соответствует времени, предыдущий end ≤ следующий start.
Граница принадлежит следующей строке. UI показывает секунды, преобразование в ms
делает в одном месте. Для ASS точность 10 мс; правила округления согласуют A1/A2.

Ошибка: `{"error":{"code":"INVALID_TIMING","message":"...","field":"lines[1].end_ms"}}`.
401 не используется для раскрытия чужого проекта: чужой/неизвестный ID - 404.
413 размер, 415 формат, 422 данные, 409 активный job, 429 лимит, 503 очередь.
Конкретные error codes фиксируются в PR реализации; UI всегда умеет показать message.

Перед render F2 ждёт успешного PUT. Снимок содержит audio identity, revision, style,
duration и lines. Изменение draft не меняет уже запущенный job. Замена аудио с разметкой
в v0 предлагает новый проект. При ошибке polling повторять GET того же job, не POST render.
Сессии, права, snapshot, атомарность очереди, Range и сохранение реализуются отдельно.

Контракт renderer: `render_video(spec, audio_path, output_path) -> RenderResult`.
Тестовый JSON: tests/fixtures/render-spec.json (точное имя сверяйте в fixtures README).
DTO API преобразуется в RenderSpec явным адаптером B2, без передачи ORM-объектов в очередь.
