"""B1: потоковое сохранение, проверка ffprobe и контролируемые сервером пути."""

from pathlib import Path
from uuid import UUID

from fastapi import UploadFile

MAX_AUDIO_BYTES = 20 * 1024 * 1024
MIN_DURATION_MS = 5_000
MAX_DURATION_MS = 60_000


async def store_audio(project_id: UUID, upload: UploadFile, owner_session_hash: str) -> int:
    """TODO B1-02: проверить владельца, писать порциями во временный файл, вернуть duration_ms.

    Лимит 20MiB проверять по прочитанным байтам. ffprobe с timeout проверяет реальный
    MP3/WAV и 5-60с. Повреждённые/слишком большие файлы удалять; путь из имени не брать.
    Повторную замену имеющегося аудио отклонять 409: пользователь создаёт новый проект.
    """
    raise NotImplementedError("B1-02: store_audio")


def get_audio_path(project_id: UUID, owner_session_hash: str) -> Path:
    """TODO B1-02: проверить владельца и вернуть существующий путь внутри data/projects.

    FileResponse используется маршрутом; проверить 206/Range и отсутствие path traversal.
    """
    raise NotImplementedError("B1-02: get_audio_path")
