"""B1/B2: начальная схема; сервисы сохранения пока не реализованы."""

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import JSON, DateTime, ForeignKey, Index, Integer, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


def utc_now() -> datetime:
    """Хранить серверное время в UTC; в UI преобразовывать при отображении."""
    return datetime.now(timezone.utc)


class ProjectRecord(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    owner_session_hash: Mapped[str] = mapped_column(String(64), index=True)
    style: Mapped[str] = mapped_column(String(20), default="brat")
    duration_ms: Mapped[int | None] = mapped_column(Integer)
    audio_path: Mapped[str | None] = mapped_column(Text)
    revision: Mapped[int] = mapped_column(Integer, default=0)
    latest_job_id: Mapped[str | None] = mapped_column(String(36))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class LyricLineRecord(Base):
    __tablename__ = "lyric_lines"

    project_id: Mapped[str] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True
    )
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    position: Mapped[int] = mapped_column(Integer)
    text: Mapped[str] = mapped_column(String(120))
    start_ms: Mapped[int | None] = mapped_column(Integer)
    end_ms: Mapped[int | None] = mapped_column(Integer)


class RenderJobRecord(Base):
    __tablename__ = "render_jobs"
    __table_args__ = (
        Index(
            "uq_active_job_per_project",
            "project_id",
            unique=True,
            sqlite_where=text("status IN ('queued', 'running')"),
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"))
    status: Mapped[str] = mapped_column(String(16), default="queued")
    snapshot: Mapped[dict[str, Any]] = mapped_column(JSON)
    output_path: Mapped[str | None] = mapped_column(Text)
    error_code: Mapped[str | None] = mapped_column(String(64))
    error_message: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
