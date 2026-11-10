import type { LyricLine, Project } from '../../shared/types/project';

/** F2: строки из вставленного текста. Пустые пропускаем, одинаковые тексты имеют разные id.
 * Перед заменой существующей разметки UI обязан запросить подтверждение потери таймингов.
 */
export function splitLyrics(text: string): LyricLine[] {
  return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => ({
    id: crypto.randomUUID(), text: line, start_ms: null, end_ms: null,
  }));
}

/** TODO F2 + F1: проверить готовность, await saveLyrics, затем createRender один раз.
 * Вход: текущий проект; выход: job_id. При 409 открыть уже активную задачу, не терять черновик.
 * Приёмка: медленное сохранение завершается раньше POST renders; ошибка PUT блокирует render.
 */
export async function saveAndStartRender(_project: Project): Promise<string> {
  throw new Error('TODO F2 + F1: сохранение и запуск генерации ещё не подключены.');
}
