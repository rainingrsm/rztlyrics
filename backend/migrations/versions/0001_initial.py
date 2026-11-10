"""B1: начальные таблицы проектов, строк и фоновых заданий."""

import sqlalchemy as sa
from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Создать независимую от HTTP схему; не записывать демонстрационные успехи или данные."""
    op.create_table(
        "projects",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("owner_session_hash", sa.String(64), nullable=False),
        sa.Column("style", sa.String(20), nullable=False),
        sa.Column("duration_ms", sa.Integer()),
        sa.Column("audio_path", sa.Text()),
        sa.Column("revision", sa.Integer(), nullable=False),
        sa.Column("latest_job_id", sa.String(36)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_projects_owner_session_hash", "projects", ["owner_session_hash"])
    op.create_table(
        "lyric_lines",
        sa.Column(
            "project_id",
            sa.String(36),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("text", sa.String(120), nullable=False),
        sa.Column("start_ms", sa.Integer()),
        sa.Column("end_ms", sa.Integer()),
    )
    op.create_table(
        "render_jobs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "project_id",
            sa.String(36),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("status", sa.String(16), nullable=False),
        sa.Column("snapshot", sa.JSON(), nullable=False),
        sa.Column("output_path", sa.Text()),
        sa.Column("error_code", sa.String(64)),
        sa.Column("error_message", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True)),
        sa.Column("finished_at", sa.DateTime(timezone=True)),
    )
    op.create_index(
        "uq_active_job_per_project",
        "render_jobs",
        ["project_id"],
        unique=True,
        sqlite_where=sa.text("status IN ('queued', 'running')"),
    )


def downgrade() -> None:
    """Откат удаляет данные таблиц; применять только осознанно на тестовой БД."""
    op.drop_table("render_jobs")
    op.drop_table("lyric_lines")
    op.drop_table("projects")
