"""Вход Uvicorn: uvicorn app.main:app --reload. Бизнес-маршруты пока возвращают 501."""

from fastapi import FastAPI

from app.api import health, jobs, projects, renders, uploads
from app.errors import register_error_handlers

app = FastAPI(
    title="RZT Lyrics API (каркас)",
    version="0.0.0",
    docs_url="/api/docs",
    redoc_url=None,
    openapi_url="/api/openapi.json",
)
register_error_handlers(app)
for router in (health.router, projects.router, uploads.router, renders.router, jobs.router):
    app.include_router(router, prefix="/api/v1")
