# GitHub: первая настройка и работа каждого участника

Репозиторий уже существует: https://github.com/rainingrsm/rztlyrics.
Локально есть `main`, remote `origin`, один начальный коммит. Эти сведения проверены
при подготовке каркаса; перед выполнением команд снова смотрите `git status` и `git branch -a`.
Настройки GitHub, роли и PR этим каркасом не созданы. Ниже действия команды.
Команды рассчитаны на PowerShell из корня репозитория, кроме явно указанного `cd`.

## 1. Владелец репозитория + Варвара: загрузить каркас один раз

В существующей папке **не выполняйте git init и не создавайте второй origin**.
Сначала настройте своё имя и подтверждённый GitHub email (можно noreply из Settings → Emails).

```powershell
cd C:\Users\Windows\Desktop\rztlyrics
git config user.name "Ваше имя"
git config user.email "Ваш подтверждённый email"
git status
git remote -v
git fetch origin
git switch -c codex/bootstrap-scaffold
git add .dockerignore .editorconfig .env.example .gitattributes .gitignore .nvmrc .python-version
git add README.MD CONTRIBUTING.md LICENSE.md backend frontend docs
git add infra compose.yaml .github tests scripts output/pdf
git diff --staged --stat
git diff --staged
git commit -m "chore: add RZT project scaffold and team plan"
git push -u origin codex/bootstrap-scaffold
```

Перед commit проверьте, что нет `.env`, аудио, node_modules, .venv и tmp. Файлы документации
и итоговый PDF включены намеренно. При ошибке команды остановитесь и прочитайте её;
не используйте `--force` или `reset --hard`.

На GitHub → Pull requests → New pull request: **base main**, compare `codex/bootstrap-scaffold`.
Это единственное стартовое исключение: `develop` ещё не создана. Назначьте ревьюера Руслану
или другого участника, кроме автора. Дождитесь frontend/backend checks. Merge через
**Create a merge commit**. Если правила уже включены, выполните их, не обходите.
После merge, с чистой рабочей папкой:

```powershell
git switch main
git pull --ff-only origin main
git switch -c develop
git push -u origin develop
```

Если `develop` уже существует, не создавайте заново: `git fetch origin`, затем
`git switch develop` (либо `git switch --track origin/develop`, если нет локальной).

## 2. Владелец: доступ, защита, доска

1. Settings → Collaborators: пригласите остальных пятерых по настоящим GitHub-логинам.
   Всем нужен доступ на запись; админские права не требуются для обычных PR.
2. Settings → General: default branch `main`; разрешите merge commits.
   Не используйте squash/rebase merge в процессе команды. Автоудаление head-веток
   выключите, чтобы после релиза не удалить `develop`.
3. Settings → Branches → Add classic branch protection rule: отдельно `main`, отдельно `develop`.
   Требовать PR, 1 approval, решение обсуждений; сбрасывать approval после новых изменений.
   Запретить force push/удаление. Применить правило и к администраторам при доступности настройки.
   Не включать linear history: команда использует merge commits.
4. После первого успешного Actions запуска добавьте фактические checks `frontend` и `backend`
   в required status checks. Требуйте актуальность ветки. Пока не добавляйте renderer-e2e:
   такого исполняемого check ещё нет. Нельзя делать обязательным несуществующий check.
5. В `.github/CODEOWNERS` замените закомментированные примеры реальными логинами с write.
   До этого не включайте обязательный Code Owners review. Это отдельный маленький PR Варвары.
6. Создайте milestone `v0.0.1`, ориентир 27.12.2026, labels `area:frontend`, `area:backend`,
   `area:algorithm`, `area:qa`, `area:docs`, `priority:P0`, `priority:P1`, `priority:P2`.
7. Доска Project: Backlog → Ready → In progress → Review → QA → Done.
   Заведите задачи из docs/backlog.md; каждый пункт подробного плана делите на PR до 1-2 дней.

Защита веток зависит от тарифа/видимости репозитория. Если настройка недоступна,
проверьте применимость своего тарифа, не отмечайте защиту включённой без проверки.
Публичность и требования организаторов команда подтверждает отдельно.
[Официальная документация защиты](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).

## 3. Каждый участник: получить репозиторий на свой компьютер

Если папки ещё нет:

```powershell
git clone https://github.com/rainingrsm/rztlyrics.git
cd rztlyrics
git config user.name "Ваше имя"
git config user.email "Ваш подтверждённый email"
git fetch origin
git switch --track origin/develop
```

Если локальная develop уже есть: `git switch develop`, `git pull --ff-only origin develop`.
Для входа используйте GitHub Desktop/менеджер учётных данных или настроенный SSH.
Пароль аккаунта и токен не вставляйте в исходники или URL remote.

## 4. Первая ветка Ильи (F1)

Возьмите F1-01 в backlog, назначьте себе. Читайте docs/tasks/frontend.md, раздел F1.

```powershell
git switch develop
git pull --ff-only origin develop
git switch -c codex/f1-01-upload
cd frontend
npm ci
npm run dev
# После правок остановите dev Ctrl+C и выполните:
npm run lint
npm run test -- --run
npm run build
cd ..
git add frontend/src/features/upload frontend/src/shared/api
git diff --staged
git commit -m "feat(upload): connect project creation and audio upload"
git push -u origin codex/f1-01-upload
```

Добавляйте только реально изменённые файлы задачи. В PR base `develop`, ревьюер Леонид;
Руслана проверяет HTTP-контракт. Следующие ветки: `codex/f1-02-results`, `codex/f1-03-ui-errors`.

## 5. Первая ветка Леонида (F2)

Задача F2-01, подробности в docs/tasks/frontend.md.

```powershell
git switch develop
git pull --ff-only origin develop
git switch -c codex/f2-01-editor
cd frontend
npm ci
npm run dev
# После правок:
npm run lint
npm run test -- --run
npm run build
cd ..
git add frontend/src/features/editor
git diff --staged
git commit -m "feat(editor): edit and validate manual line timings"
git push -u origin codex/f2-01-editor
```

PR в `develop`, ревьюер Илья; Татьяна смотрит интервалы. Следующие ветки:
`codex/f2-02-save-draft`, `codex/f2-03-save-render-flow`. Не меняйте API-клиент параллельно
с Ильёй без короткого согласования.

## 6. Первая ветка Русланы (B1)

Задача B1-01, docs/tasks/backend.md. Сначала сессия/проект, затем upload и draft.

```powershell
git switch develop
git pull --ff-only origin develop
git switch -c codex/b1-01-projects
cd backend
uv sync --frozen
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
# После правок и остановки сервера:
uv run ruff check .
uv run ruff format --check .
uv run pytest
cd ..
git add backend/app/services/sessions.py backend/app/services/projects.py backend/app/api/projects.py
git diff --staged
git commit -m "feat(projects): persist projects with anonymous ownership"
git push -u origin codex/b1-01-projects
```

Если менялись модели/миграции/тесты - добавьте их отдельным `git add` и проверьте diff.
Ревьюер Варвара; Илья проверяет вызов createProject. Далее `codex/b1-02-upload`,
`codex/b1-03-lyrics`. Не добавляйте созданную SQLite БД.

## 7. Первая ветка Варвары (B2)

Задача B2-01: воспроизводимый Compose/CI; B2-02: lifecycle jobs.

```powershell
git switch develop
git pull --ff-only origin develop
git switch -c codex/b2-01-integration
Copy-Item .env.example .env
docker compose config
docker compose build
docker compose run --rm api uv run --no-sync alembic upgrade head
docker compose up -d
docker compose ps
docker compose logs --tail=50 api worker
git add compose.yaml infra .github
git diff --staged
git commit -m "chore(infra): verify shared API and worker environment"
git push -u origin codex/b2-01-integration
```

`Copy-Item` нужен один раз; существующий `.env` не перезаписывайте.
Ревьюер Руслана; Андрей проверяет FFmpeg внутри worker. Далее `codex/b2-02-jobs`,
`codex/b2-03-video-delivery`, `codex/b2-04-staging`. Windows worker - в Linux-контейнере.
Lock-файлы меняйте штатным npm/uv, не вручную.

## 8. Первая ветка Андрея (A1)

Задача A1-01: ASS/CLI, затем настоящий MP4. Подробности docs/tasks/algorithm-qa.md.

```powershell
git switch develop
git pull --ff-only origin develop
git switch -c codex/a1-01-ass
cd backend
uv sync --frozen
uv run ruff check .
uv run ruff format --check .
uv run pytest tests/test_renderer_contract.py
cd ..
git add backend/renderer/ass.py backend/tests/test_renderer_contract.py
git diff --staged
git commit -m "feat(renderer): serialize safe ASS subtitles"
git push -u origin codex/a1-01-ass
```

Ревьюер Татьяна; Варвара принимает функцию render_video после следующей задачи.
Далее `codex/a1-02-ffmpeg`, `codex/a1-03-render-pipeline`.
MP4 и пользовательское аудио в Git не добавляйте. Проверку выполненного рендера
записывайте в PR: команда, длительность, кодеки, параметры, время исполнения.

## 9. Первая ветка Татьяны (A2 + QA)

Задача A2-01: граничные проверки/fixtures. Затем probe, потом QA основного сценария.

```powershell
git switch develop
git pull --ff-only origin develop
git switch -c codex/a2-01-validation
cd backend
uv sync --frozen
uv run pytest tests/test_renderer_contract.py tests/test_schemas.py
uv run ruff check .
uv run ruff format --check .
cd ..
git add backend/renderer/validation.py backend/tests/test_renderer_contract.py tests/fixtures
git diff --staged
git commit -m "test(renderer): cover timing boundaries and invalid inputs"
git push -u origin codex/a2-01-validation
```

Ревьюер Андрей. Далее `codex/a2-02-probe`, `codex/qa-01-smoke`, `codex/qa-02-regression`.
Для QA-ветки коммитьте docs/test-report.md, сценарии и автоматизацию, не только скриншоты.
Дефекты заводите через bug template с SHA и шагами. Самостоятельно не принимайте свой PR:
Андрей проверяет алгоритм, Руслана/Леонид - интеграцию.

## 10. Для всех: что делать после push

1. Pull requests → New: **base develop**, compare ваша ветка. Draft, если ещё не готово.
2. Заголовок описывает поведение. Тело по шаблону: `Refs #реальный_номер`, что изменилось,
   команды проверки, ожидаемый результат, ограничения. Номера из примеров не копируйте.
3. Назначьте указанного ревьюера. Изменение общего DTO согласуют обе стороны.
4. Замечания исправляйте коммитами в этой же ветке; `git push` обновит PR.
5. После approval, зелёного CI, разрешённых обсуждений - merge commit в develop.
6. Татьяна проверяет общий SHA и вручную закрывает issue с результатом. Для её задач
   это делает независимый проверяющий. `Closes #N` в PR в develop автоматически issue
   не закрывает при default main: [правило GitHub](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue).

Обновление своей ветки перед review (сначала сохраните собственные изменения коммитом):

```powershell
git status
git fetch origin
git merge origin/develop
# При конфликте согласуйте результат с владельцем файла, затем:
git add путь-к-исправленному-файлу
git commit
# Запустите проверки своей части
git push
```

`git commit` после merge нужен только если были конфликты, разрешённые вручную.
Если merge без конфликтов уже создал коммит, повторный commit не требуется.
Если не понимаете конфликт, `git merge --abort` отменяет начатое слияние, затем позовите коллегу.

После успешного merge и проверки:

```powershell
git switch develop
git pull --ff-only origin develop
git branch -d codex/имя-вашей-слитой-ветки
git fetch --prune
```

Удалите удалённую **ветку задачи** кнопкой Delete branch в PR. `main`/`develop` сохраняйте.
Следующую задачу всегда начинайте новой веткой из свежей develop.

## 11. Варвара + Руслана: релиз в декабре

PR **develop → main**, проверка конечного SHA, согласование QA. После merge:

```powershell
git switch main
git pull --ff-only origin main
git rev-parse HEAD
git tag -a v0.0.1 -m "RZT manual lyrics video v0.0.1"
git push origin v0.0.1
```

Тег ставьте только на проверенный коммит. Если тег уже существует, не перемещайте его:
исправление оформляется новой версией. GitHub → Releases → Draft a new release →
выберите тег; добавьте SHA, URL стенда, инструкции, ограничения, тест-отчёт и демо.
Проверьте ссылки с другого устройства, затем публикуйте.
[Официальная инструкция Release](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository).
