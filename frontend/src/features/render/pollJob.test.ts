import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getJob } from '../../shared/api/projects';
import type { RenderJob } from '../../shared/types/project';
import { pollJob } from './pollJob';

vi.mock('../../shared/api/projects', () => ({ getJob: vi.fn() }));
const getJobMock = vi.mocked(getJob);

function job(status: RenderJob['status']): RenderJob {
  return { id: 'job-1', project_id: 'project-1', status, video_url: null, error: null };
}

beforeEach(() => {
  vi.useFakeTimers();
  getJobMock.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('pollJob', () => {
  it('waits for each request before starting the delay and stops after success', async () => {
    let finishFirst!: (value: RenderJob) => void;
    getJobMock.mockReturnValueOnce(new Promise(resolve => { finishFirst = resolve; }))
      .mockResolvedValueOnce(job('running')).mockResolvedValueOnce(job('succeeded'));
    const controller = new AbortController();
    const onUpdate = vi.fn();
    const done = pollJob('job-1', onUpdate, controller.signal);

    expect(getJobMock).toHaveBeenCalledExactlyOnceWith('job-1', controller.signal);
    await vi.advanceTimersByTimeAsync(5_000);
    expect(getJobMock).toHaveBeenCalledTimes(1);
    finishFirst(job('queued'));
    await vi.advanceTimersByTimeAsync(1_999);
    expect(getJobMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(2_001);
    await done;
    expect(onUpdate.mock.calls.map(([update]) => update.status)).toEqual(['queued', 'running', 'succeeded']);
    expect(getJobMock.mock.calls).toEqual(Array(3).fill(['job-1', controller.signal]));
    expect(vi.getTimerCount()).toBe(0);
  });

  it('reports a failed job and stops polling it', async () => {
    const failed = { ...job('failed'), error: { code: 'RENDER_FAILED', message: 'Рендер не удался' } };
    getJobMock.mockResolvedValueOnce(failed);
    const onUpdate = vi.fn();

    await pollJob('job-1', onUpdate, new AbortController().signal);
    expect(onUpdate).toHaveBeenCalledExactlyOnceWith(failed);
    expect(getJobMock).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cancels a pending delay on abort', async () => {
    const controller = new AbortController();
    getJobMock.mockResolvedValueOnce(job('queued'));
    const done = pollJob('job-1', vi.fn(), controller.signal);
    await vi.advanceTimersByTimeAsync(0);
    expect(vi.getTimerCount()).toBe(1);

    controller.abort();
    await done;
    await vi.advanceTimersByTimeAsync(4_000);
    expect(vi.getTimerCount()).toBe(0);
    expect(getJobMock).toHaveBeenCalledTimes(1);
  });

  it('does not publish a late response after cancellation', async () => {
    const controller = new AbortController();
    getJobMock.mockResolvedValueOnce(job('queued'));
    const onUpdate = vi.fn();
    const done = pollJob('job-1', onUpdate, controller.signal);
    controller.abort();

    await done;
    expect(onUpdate).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('returns a network error to the caller without retrying', async () => {
    const error = new TypeError('Network error');
    getJobMock.mockRejectedValueOnce(error);

    await expect(pollJob('job-1', vi.fn(), new AbortController().signal)).rejects.toBe(error);
    expect(getJobMock).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});
