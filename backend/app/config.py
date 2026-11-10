"""B1/B2: единые настройки API, миграций и worker из переменных окружения."""

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    """Настройки каркаса; секретов и production-значений по умолчанию нет."""

    data_dir: Path
    database_url: str
    redis_url: str
    app_version: str
    commit_sha: str
    session_cookie_secure: bool


@lru_cache
def get_settings() -> Settings:
    """Прочитать окружение. В Docker DATA_DIR=/data; локально используется корень/data."""
    data_dir = Path(os.getenv("DATA_DIR", str(Path(__file__).resolve().parents[2] / "data")))
    data_dir = data_dir.resolve()
    return Settings(
        data_dir=data_dir,
        database_url=os.getenv("DATABASE_URL", f"sqlite:///{data_dir / 'rzt.db'}"),
        redis_url=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
        app_version=os.getenv("APP_VERSION", "0.0.0"),
        commit_sha=os.getenv("COMMIT_SHA", "unknown"),
        session_cookie_secure=os.getenv("SESSION_COOKIE_SECURE", "false").lower() == "true",
    )
