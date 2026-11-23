import { ApiError } from '../../shared/api/client';
import { createRender, getJob, getProject, saveLyrics } from '../../shared/api/projects';
import type { LyricLine, Project } from '../../shared/types/project';
import { validateRenderLines } from './validation';

/** F2: строки из вставленного текста. Пустые пропускаем, одинаковые тексты имеют разные id.
 * Перед заменой существующей разметки UI обязан запросить подтверждение потери таймингов.
 */
export function splitLyrics(text: string): LyricLine[] {
  return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => ({
    id: crypto.randomUUID(), text: line, start_ms: null, end_ms: null,
  }));
}

async function findActiveRender(projectId: string): Promise<string | undefined> {
  const { latest_job_id: latestJobId } = await getProject(projectId);
  if (!latestJobId) return undefined;

  const job = await getJob(latestJobId);
  if (job.id === latestJobId && job.project_id === projectId && (job.status === 'queued' || job.status === 'running')) {
    return job.id;
  }
}

export async function saveAndStartRender(project: Project, onSaved?: (savedProject: Project) => void): Promise<string> {
  const [issue] = validateRenderLines(project.lines, project.duration_ms);
  if (issue) throw new ApiError(422, { code: 'INVALID_TIMING', ...issue });

  const savedProject = await saveLyrics(project.id, { style: project.style, lines: project.lines });
  onSaved?.(savedProject);

  try {
    const job = await createRender(project.id);
    if (typeof job?.job_id !== 'string' || !job.job_id.trim()) {
      throw new ApiError(502, { code: 'INVALID_RENDER_RESPONSE', message: 'Сервер не вернул идентификатор задачи.' });
    }
    return job.job_id;
  } catch (error) {
    if (!(error instanceof TypeError) && !(error instanceof ApiError && error.status === 409)) throw error;

    // A conflict or lost response may leave an active job. Check it without repeating the POST.
    const activeJobId = await findActiveRender(project.id).catch(() => undefined);
    if (activeJobId) return activeJobId;
    throw error;
  }
}
