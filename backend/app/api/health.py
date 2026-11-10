"""Рабочие диагностические маршруты каркаса. Health не проверяет Redis или БД."""

from fastapi import APIRouter

from app.config import get_settings

router = APIRouter(tags=["diagnostics"])


@router.get("/health")
def health() -> dict[str, str]:
    """B2: liveness API; готовность зависимостей будет отдельной проверкой перед релизом."""
    return {"status": "ok", "stage": "scaffold"}


@router.get("/version")
def version() -> dict[str, str]:
    """B2: вернуть версию и SHA сборки; unknown означает локальный запуск без SHA."""
    settings = get_settings()
    return {"version": settings.app_version, "commit_sha": settings.commit_sha, "stage": "scaffold"}
