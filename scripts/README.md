# Пересборка PDF

Markdown в docs/ - источник плана. После правки функций/ответственных/сроков обновите
соответствующие документы, затем из корня:

```powershell
py -3.12 -m pip install -r scripts/requirements-docs.txt
py -3.12 scripts/build_team_pdf.py
```

Выход: output/pdf/rzt-team-guide.pdf. Нужны Arial/Consolas (Windows) или
fonts-dejavu-core (Linux). Системные шрифты не копируются в репозиторий.
Проверьте каждую страницу после сборки: таблицы, переносы кода, содержание, заголовки.
Дату редакции и статус проверок меняйте в документах и скрипте осознанно.
