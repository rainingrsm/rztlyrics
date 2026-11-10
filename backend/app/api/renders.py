"""B2: запуск фоновой генерации по сохранённому снимку проекта."""

from uuid import UUID

from fastapi import APIRouter

from app.errors import not_implemented
from app.schemas.jobs import RenderAccepted

router = APIRouter(tags=["renders"])


@router.post("/projects/{project_id}/renders", response_model=RenderAccepted, status_code=202)
def start_render(project_id: UUID) -> RenderAccepted:
    """TODO B2-02: validate -> snapshot -> атомарный claim -> RQ; двойной клик даёт 409."""
    not_implemented("B2", "снимок проекта, проверку готовности и постановку в очередь")
