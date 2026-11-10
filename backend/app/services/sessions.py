"""B1: анонимная сессия без регистрации. Не доверять UUID проекта как авторизации."""

from fastapi import Request, Response


def get_or_create_session(request: Request, response: Response) -> str:
    """TODO B1-01: криптографически случайная cookie, вернуть её hash для поиска владельца.

    HttpOnly, SameSite=Lax, Secure на HTTPS. Сессию создавать при POST /projects;
    для чтения без cookie возвращать 404. Проверить разные браузерные сессии.
    """
    raise NotImplementedError("B1-01: anonymous session")


def require_session(request: Request) -> str:
    """TODO B1-01: вернуть hash существующей cookie; не создавать новую при GET чужого URL."""
    raise NotImplementedError("B1-01: require_session")
