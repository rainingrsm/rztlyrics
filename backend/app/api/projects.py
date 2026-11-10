"""B1: проекты и сохранение черновика; до реализации все операции возвращают 501."""

from uuid import UUID

from fastapi import APIRouter

from app.errors import not_implemented
from app.schemas.projects import LyricsUpdate, ProjectResponse

router = APIRouter(tags=["projects"])


@router.post("/projects", response_model=ProjectResponse, status_code=201)
def create_project() -> ProjectResponse:
    """TODO B1-01: создать проект и HttpOnly-сессию; проверить 201 и доступ только владельца."""
    not_implemented("B1", "создание проекта и анонимной сессии")


@router.get("/projects/{project_id}", response_model=ProjectResponse)
def get_project(project_id: UUID) -> ProjectResponse:
    """TODO B1-01: получить проект по UUID и сессии; неизвестный/чужой UUID даёт 404."""
    not_implemented("B1", "чтение проекта с проверкой владельца")


@router.put("/projects/{project_id}/lyrics", response_model=ProjectResponse)
def save_lyrics(project_id: UUID, payload: LyricsUpdate) -> ProjectResponse:
    """TODO B1-03: атомарно сохранить draft и revision; проверить восстановление после F5."""
    not_implemented("B1", "сохранение строк и таймингов")
