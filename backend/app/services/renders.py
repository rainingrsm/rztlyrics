"""B2: согласование SQLite и Redis; ошибки очереди не должны оставлять вечный queued."""

from pathlib import Path
from uuid import UUID

from app.schemas.jobs import JobResponse, RenderAccepted


def enqueue_render(project_id: UUID, owner_session_hash: str) -> RenderAccepted:
    """TODO B2-02: проверить сессию/draft, сохранить неизменяемый snapshot, enqueue job_id.

    UNIQUE partial index защищает от двух active jobs. При конфликте 409; Redis недоступен
    -> записать failed и вернуть 503. Согласовать повтор/идемпотентность с B1 и F2.
    Приёмка: двойной клик, правка draft во время рендера, отключённый Redis.
    """
    raise NotImplementedError("B2-02: enqueue_render")


def load_job(job_id: UUID, owner_session_hash: str) -> JobResponse:
    """TODO B2-02: получить статус только задачи собственного проекта; failed содержит error."""
    raise NotImplementedError("B2-02: load_job")


def get_result_path(job_id: UUID, owner_session_hash: str) -> Path:
    """TODO B2-03: вернуть проверенный MP4 своего succeeded job внутри DATA_DIR.

    Неизвестная/чужая задача -> 404; неготовый результат -> 409; путь не включать в DTO.
    Маршрут использует FileResponse для Range и attachment, без открытия каталога /data.
    """
    raise NotImplementedError("B2-03: get_result_path")


def reconcile_interrupted_jobs() -> int:
    """TODO B2-04: найти потерянные running/queued по RQ+heartbeat, пометить failed, вернуть count.

    Не объявлять живую задачу потерянной по одному возрасту; после restart доступен повтор.
    """
    raise NotImplementedError("B2-04: reconcile_interrupted_jobs")
