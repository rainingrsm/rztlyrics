"""B1: загрузка и выдача аудио; тип файла проверяется содержимым, а не расширением."""

from uuid import UUID

from fastapi import APIRouter, UploadFile
from fastapi.responses import FileResponse

from app.errors import not_implemented
from app.schemas.projects import ProjectResponse

router = APIRouter(tags=["audio"])


@router.post("/projects/{project_id}/audio", response_model=ProjectResponse)
async def upload_audio(project_id: UUID, file: UploadFile) -> ProjectResponse:
    """TODO B1-02: принять multipart file, проверить 20MiB/MP3/WAV/5-60с; вернуть Project."""
    not_implemented("B1", "потоковую загрузку и проверку аудио через ffprobe")


@router.get("/projects/{project_id}/audio", response_class=FileResponse)
def get_audio(project_id: UUID) -> FileResponse:
    """TODO B1-02: после проверки владельца отдать файл; проверить Range и перемотку."""
    not_implemented("B1", "выдачу аудио владельцу проекта")
