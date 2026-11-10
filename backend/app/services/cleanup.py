"""B2: явная очистка только данных приложения, никогда исходников или активных задач."""


def cleanup_expired_projects(retention_hours: int = 24) -> int:
    """TODO B2-04: удалить истёкшие неактивные проекты/файлы; вернуть количество проектов.

    Проверить абсолютный путь внутри DATA_DIR, сохранить активные jobs и demo fixture.
    Добавить dry-run при реализации; проверить граничный срок и нехватку места.
    """
    raise NotImplementedError("B2-04: cleanup_expired_projects")
