FROM python:3.12-slim-bookworm
COPY --from=ghcr.io/astral-sh/uv:0.13.7 /uv /uvx /bin/
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 UV_LINK_MODE=copy UV_CACHE_DIR=/tmp/uv-cache
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg fontconfig fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY backend/pyproject.toml backend/uv.lock ./
COPY backend/app ./app
COPY backend/renderer ./renderer
COPY backend/migrations ./migrations
COPY backend/alembic.ini ./
RUN uv sync --frozen --no-dev --no-editable \
    && groupadd --gid 10001 rzt \
    && useradd --uid 10001 --gid rzt --create-home rzt \
    && mkdir -p /data && chown rzt:rzt /data
USER rzt
ENV UV_CACHE_DIR=/home/rzt/.cache/uv
EXPOSE 8000
CMD ["uv", "run", "--no-sync", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
