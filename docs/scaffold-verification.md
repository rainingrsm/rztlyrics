# Проверка стартового каркаса

Редакция 9 ноября 2026. Это проверка структуры и реализованных утилит, не приёмка продукта.

| Проверка | Результат |
| --- | --- |
| npm ci | PASS, установка из package-lock.json |
| npm run lint | PASS |
| npm run test -- --run | PASS, 25 тестов |
| npm run build | PASS |
| pytest backend/tests | PASS, 40 тестов |
| Ruff check + format --check | PASS |
| Alembic upgrade head + check | PASS на отдельной временной SQLite БД |
| Генератор WAV и отказ перезаписи | PASS |
| Renderer CLI | Ожидаемый код 3, MP4 не создаётся |
| Docker Compose / FFmpeg в Linux-контейнере | NOT RUN: Docker отсутствует в среде подготовки |
| GitHub Actions | NOT RUN: коммиты и push не выполнялись |
| Полный браузер → MP4 | NOT IMPLEMENTED |

Среда: Windows, Python 3.12.14, локальный Node 26.13.0. Для команды/CI закреплена
ветка Node 22, минимум 22.13; прогон на этой ветке проверит первый CI.
Один warning Starlette об устаревающем httpx TestClient не приводит к падению тестов;
обновление тестового клиента - отдельная задача при обновлении зависимостей.

Доказательства готовности будущего v0 записываются в docs/test-report.md с реальным SHA,
устройствами, стендом и результатами. Не переносите эти PASS на продуктовые сценарии.
