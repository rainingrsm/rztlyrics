# Окружение - Варвара (B2)

Compose - локальная заготовка четырёх сервисов, не production deployment.
API и worker используют один образ Python/FFmpeg и volume. Caddy сохраняет префикс /api.
SQLite создаётся миграцией; `uv run alembic upgrade head` выполняется отдельно перед стартом.
Redis не публикует порт наружу. HTTP-порты доступны только localhost.

Следующие действия:
1. Выполнить команды README на Docker Desktop с Linux containers.
2. Проверить ffmpeg/libass/кодеки/шрифт внутри worker; записать версии.
3. После реализации очереди проверить snapshot и один job на проект; добавить проверку
   доступности Redis/БД отдельно от liveness /health.
4. На стенде настроить домен, HTTPS, SESSION_COOKIE_SECURE=true, Origin/CSRF и лимиты.
5. Реализовать cleanup/reconcile и запуск по расписанию; активные задачи не удалять.
6. Проверить restart с сохранением volume, disk-full и timeout. Не использовать `down -v`
   как обычный способ остановки: он удаляет данные.
7. Перед релизом закрепить проверенные image digests. Сейчас теги образов могут обновляться.

Проверка контейнера после сборки:

```powershell
docker compose run --rm worker ffmpeg -version
docker compose run --rm worker ffmpeg -filters
docker compose run --rm worker ffprobe -version
docker compose run --rm worker fc-match "DejaVu Sans"
```

Проверьте фильтр ass/subtitles и кодеки libx264/AAC; наличие бинарника само по себе не
подтверждает готовность рендера. Документация uv Docker:
https://docs.astral.sh/uv/guides/integration/docker/.
