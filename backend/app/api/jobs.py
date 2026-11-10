"""B2: состояние задачи и защищённая выдача готового MP4."""

from uuid import UUID

from fastapi import APIRouter
from fastapi.responses import FileResponse

from app.errors import not_implemented
from app.schemas.jobs import JobResponse

router = APIRouter(tags=["jobs"])


@router.get("/jobs/{job_id}", response_model=JobResponse)
def get_job(job_id: UUID) -> JobResponse:
    """TODO B2-02: вернуть сохранённый статус; video_url только при succeeded; чужой ->404."""
    not_implemented("B2", "чтение состояния задания с проверкой владельца")


@router.get("/jobs/{job_id}/video", response_class=FileResponse)
def get_video(job_id: UUID, download: bool = False) -> FileResponse:
    """TODO B2-03: Range для просмотра, download=1 для attachment; проверить MP4/владельца."""
    not_implemented("B2", "просмотр и скачивание готового видео")
