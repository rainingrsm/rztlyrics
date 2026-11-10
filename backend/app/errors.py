"""Общий формат ошибок API, включая ещё не реализованные обработчики."""

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


def not_implemented(owner: str, task: str) -> None:
    """Явно остановить запрос к заготовке вместо имитации успешной операции."""
    raise HTTPException(
        status_code=501,
        detail={
            "code": "NOT_IMPLEMENTED",
            "message": f"Каркас: {owner} должен реализовать {task}.",
            "field": None,
        },
    )


def register_error_handlers(app: FastAPI) -> None:
    """Подключить единый envelope error для HTTP-ошибок и проверок Pydantic."""

    @app.exception_handler(StarletteHTTPException)
    async def handle_http_error(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        detail = exc.detail
        if not isinstance(detail, dict) or "code" not in detail:
            detail = {"code": "HTTP_ERROR", "message": str(detail), "field": None}
        return JSONResponse({"error": detail}, status_code=exc.status_code, headers=exc.headers)

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        first = exc.errors()[0]
        field = ""
        for part in first["loc"]:
            if part in ("body", "query", "path"):
                continue
            field += f"[{part}]" if isinstance(part, int) else ("." if field else "") + str(part)
        return JSONResponse(
            {"error": {"code": "VALIDATION_ERROR", "message": first["msg"], "field": field}},
            status_code=422,
        )
