"""B1: хранение проектов. Здесь использовать SQLAlchemy и проверять сессию на каждом чтении."""

from uuid import UUID

from app.schemas.projects import LyricsUpdate, ProjectResponse


def create_project(owner_session_hash: str) -> ProjectResponse:
    """TODO B1-01: создать UUID/ProjectRecord; вход - hash сессии, выход - безопасный DTO.

    Приёмка: проект доступен создателю, в другой сессии возвращается 404.
    """
    raise NotImplementedError("B1-01: create_project")


def load_project(project_id: UUID, owner_session_hash: str) -> ProjectResponse:
    """TODO B1-01: прочитать проект и строки по position; не раскрывать пути или чужие записи."""
    raise NotImplementedError("B1-01: load_project")


def save_draft(project_id: UUID, owner_session_hash: str, draft: LyricsUpdate) -> ProjectResponse:
    """TODO B1-03: заменить строки транзакцией и увеличить revision; null разрешён.

    Проверить лимиты, границы известных времён по duration_ms, сохранность после restart.
    Нельзя менять снимок уже созданного RenderJob или молча подменять аудио.
    """
    raise NotImplementedError("B1-03: save_draft")
