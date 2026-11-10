import { request } from './client';
import type { LyricsDraft, Project, QueuedRender, RenderJob } from '../types/project';

/** F1 + B1: создать проект; сервер устанавливает HttpOnly-сессию. Пока API отвечает 501. */
export function createProject(): Promise<Project> {
  return request('/projects', { method: 'POST' });
}

/** F1 + B1: загрузить file; длительность берём только из ответа ffprobe на сервере. */
export function uploadAudio(projectId: string, file: File): Promise<Project> {
  const body = new FormData();
  body.append('file', file);
  return request(`/projects/${encodeURIComponent(projectId)}/audio`, { method: 'POST', body });
}

/** F2 + B1: восстановить сохранённый черновик при открытии URL или обновлении страницы. */
export function getProject(projectId: string, signal?: AbortSignal): Promise<Project> {
  return request(`/projects/${encodeURIComponent(projectId)}`, { signal });
}

/** F2 + B1: полностью заменить черновик и дождаться подтверждения перед render. */
export function saveLyrics(projectId: string, draft: LyricsDraft): Promise<Project> {
  return request(`/projects/${encodeURIComponent(projectId)}/lyrics`, { method: 'PUT', body: JSON.stringify(draft) });
}

/** F1 + B2: явный POST только по нажатию; сетевой сбой опроса не повторяет создание задачи. */
export function createRender(projectId: string): Promise<QueuedRender> {
  return request(`/projects/${encodeURIComponent(projectId)}/renders`, { method: 'POST' });
}

/** F1 + B2: получить состояние существующей задачи, включая ошибку без выдуманных процентов. */
export function getJob(jobId: string, signal?: AbortSignal): Promise<RenderJob> {
  return request(`/jobs/${encodeURIComponent(jobId)}`, { signal });
}
