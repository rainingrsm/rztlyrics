import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../shared/api/client';
import { createRender, getJob, getProject, saveLyrics } from '../../shared/api/projects';
import type { Project, RenderJob } from '../../shared/types/project';
import { saveAndStartRender } from './lyrics';

vi.mock('../../shared/api/projects', () => ({
  createRender: vi.fn(),
  getJob: vi.fn(),
  getProject: vi.fn(),
  saveLyrics: vi.fn(),
}));

const project: Project = {
  id: 'project-1',
  audio_url: '/api/v1/projects/project-1/audio',
  duration_ms: 5000,
  latest_job_id: null,
  revision: 1,
  style: 'brat',
  lines: [{ id: 'line-1', text: 'Первая строка', start_ms: 0, end_ms: 1000 }],
};
const savedProject = { ...project, revision: 2 };
const runningJob: RenderJob = { id: 'job-1', project_id: project.id, status: 'running', video_url: null, error: null };
const conflict = new ApiError(409, { code: 'ACTIVE_JOB', message: 'У проекта уже есть активная задача.' });

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(saveLyrics).mockResolvedValue(savedProject);
});

describe('saveAndStartRender', () => {
  it('дожидается PUT, передаёт сохранённый проект и только затем запускает POST', async () => {
    let finishSave!: (value: Project) => void;
    vi.mocked(saveLyrics).mockReturnValue(new Promise((resolve) => { finishSave = resolve; }));
    vi.mocked(createRender).mockResolvedValue({ job_id: runningJob.id, status: 'queued' });
    const onSaved = vi.fn();

    const result = saveAndStartRender(project, onSaved);
    expect(saveLyrics).toHaveBeenCalledWith(project.id, { style: project.style, lines: project.lines });
    expect(createRender).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();

    finishSave(savedProject);
    await expect(result).resolves.toBe(runningJob.id);
    expect(onSaved).toHaveBeenCalledWith(savedProject);
    expect(createRender).toHaveBeenCalledExactlyOnceWith(project.id);
  });

  it('останавливается до PUT, если тайминги не готовы', async () => {
    const incomplete = { ...project, lines: [{ ...project.lines[0], end_ms: null }] };

    await expect(saveAndStartRender(incomplete)).rejects.toMatchObject({ status: 422, details: { field: 'lines[0]' } });
    expect(saveLyrics).not.toHaveBeenCalled();
    expect(createRender).not.toHaveBeenCalled();
  });

  it('сохраняет ошибку PUT и пропускает POST', async () => {
    const error = new ApiError(422, { code: 'INVALID_TIMING', message: 'Неверное время.', field: 'lines[0].end_ms' });
    vi.mocked(saveLyrics).mockRejectedValue(error);

    await expect(saveAndStartRender(project)).rejects.toBe(error);
    expect(createRender).not.toHaveBeenCalled();
  });

  it('передаёт сохранённый проект даже при недоступной очереди', async () => {
    const error = new ApiError(503, { code: 'QUEUE_UNAVAILABLE', message: 'Очередь недоступна.' });
    vi.mocked(createRender).mockRejectedValue(error);
    const onSaved = vi.fn();

    await expect(saveAndStartRender(project, onSaved)).rejects.toBe(error);
    expect(onSaved).toHaveBeenCalledWith(savedProject);
    expect(getProject).not.toHaveBeenCalled();
  });

  it('сообщает об ошибке, если ответ запуска не содержит ID задачи', async () => {
    vi.mocked(createRender).mockResolvedValue({ job_id: '', status: 'queued' });

    await expect(saveAndStartRender(project)).rejects.toMatchObject({ details: { code: 'INVALID_RENDER_RESPONSE' } });
    expect(createRender).toHaveBeenCalledTimes(1);
    expect(getProject).not.toHaveBeenCalled();
  });

  it.each([conflict, new TypeError('Не получен ответ на POST')])('находит активную задачу без повтора POST при %s', async (error) => {
    vi.mocked(createRender).mockRejectedValue(error);
    vi.mocked(getProject).mockResolvedValue({ ...savedProject, latest_job_id: runningJob.id });
    vi.mocked(getJob).mockResolvedValue(runningJob);

    await expect(saveAndStartRender(project)).resolves.toBe(runningJob.id);
    expect(getProject).toHaveBeenCalledExactlyOnceWith(project.id);
    expect(getJob).toHaveBeenCalledExactlyOnceWith(runningJob.id);
    expect(createRender).toHaveBeenCalledTimes(1);
  });

  it('оставляет 409 для задачи, которая уже завершилась или относится к другому проекту', async () => {
    vi.mocked(createRender).mockRejectedValue(conflict);
    vi.mocked(getProject).mockResolvedValue({ ...savedProject, latest_job_id: runningJob.id });
    vi.mocked(getJob).mockResolvedValueOnce({ ...runningJob, status: 'succeeded' })
      .mockResolvedValueOnce({ ...runningJob, project_id: 'other-project' });

    await expect(saveAndStartRender(project)).rejects.toBe(conflict);
    await expect(saveAndStartRender(project)).rejects.toBe(conflict);
  });
});
