/** TODO F1: вывести <video controls> по video_url и download-ссылку текущего job.
 * Вход: URL из succeeded job и job_id; выход: плеер и ссылка /api/v1/jobs/:id/video?download=1.
 * Приёмка: видео звучит, перематывается, скачивается; URL чужого job проверяет сервер.
 */
export function VideoResult({ videoUrl: _videoUrl, jobId: _jobId }: { videoUrl: string; jobId: string }) {
  return <p className="muted">Плеер результата ещё не подключён.</p>;
}
