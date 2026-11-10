import type { RenderJob } from '../../shared/types/project';

/** TODO F1 + B2: опрашивать GET jobs примерно каждые 2 с до succeeded/failed.
 * Вход: jobId, callback, AbortSignal; выход: завершение опроса. Очистить таймер при уходе со страницы.
 * Ошибка сети не создаёт новый render. Для повторного рендера нужна отдельная кнопка и POST.
 * Приёмка: отмена и размонтирование не оставляют запросов; проценты не выдумываются.
 */
export async function pollJob(
  _jobId: string,
  _onUpdate: (job: RenderJob) => void,
  _signal: AbortSignal,
): Promise<void> {
  throw new Error('TODO F1: опрос задачи ещё не реализован.');
}
