"""B2 + A1/A2: адаптер очереди к чистому renderer.render_video."""


def run_render_job(job_id: str) -> None:
    """TODO B2-03: прочитать snapshot -> running -> renderer -> проверить MP4 -> succeeded.

    Вход - серверный UUID записи; пути берутся из доверенного хранилища.
    Renderer: render_video(spec, audio_path, output_path); HTTP/Redis туда не передавать.
    Любое исключение/timeout: failed с безопасным сообщением и уборкой неполного результата.
    Не держать транзакцию во время рендера; проверить успешный вызов и сбой subprocess.
    """
    raise NotImplementedError("B2-03: run_render_job; генерация пока не реализована")
