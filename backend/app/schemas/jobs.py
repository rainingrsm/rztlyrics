"""B2/F2: опрос queued/running/succeeded/failed без выдуманного процента выполнения."""

from typing import Literal
from uuid import UUID

from pydantic import BaseModel

JobStatus = Literal["queued", "running", "succeeded", "failed"]


class ErrorDetail(BaseModel):
    code: str
    message: str
    field: str | None = None


class RenderAccepted(BaseModel):
    job_id: UUID
    status: Literal["queued"] = "queued"


class JobResponse(BaseModel):
    id: UUID
    project_id: UUID
    status: JobStatus
    video_url: str | None = None
    error: ErrorDetail | None = None
