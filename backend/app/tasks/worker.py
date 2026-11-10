"""Запуск: python -m app.tasks.worker. На Windows запускать внутри Linux Docker."""

import os

from redis import Redis
from rq import Queue, Worker

from app.config import get_settings


def main() -> None:
    """B2: запустить один RQ worker; доступность Redis требуется только этому процессу."""
    if os.name == "nt":
        raise RuntimeError("RQ worker запускайте в Linux-контейнере: docker compose up worker")
    connection = Redis.from_url(get_settings().redis_url)
    queue = Queue("renders", connection=connection, default_timeout=300)
    Worker([queue], connection=connection).work()


if __name__ == "__main__":
    main()
