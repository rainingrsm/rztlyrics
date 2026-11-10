import type { Project } from '../../shared/types/project';

/** TODO F1: validateAudioFile → createProject → uploadAudio в строгом порядке.
 * Вход: File; выход: проект с audio_url и duration_ms. Ошибка любого шага возвращается в форму.
 * Не повторять POST автоматически после сетевого сбоя; не создавать второй проект двойным кликом.
 * Приёмка: переход /projects/:id/edit только после подтверждённой загрузки сервера.
 */
export async function uploadTrack(_file: File): Promise<Project> {
  throw new Error('TODO F1: последовательность создания проекта и загрузки ещё не подключена.');
}
