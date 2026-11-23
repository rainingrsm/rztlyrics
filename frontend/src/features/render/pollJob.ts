import { getJob } from '../../shared/api/projects';
import type { RenderJob } from '../../shared/types/project';

const POLL_DELAY_MS = 2_000;

function waitForNextPoll(signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(finish, POLL_DELAY_MS);
    signal.addEventListener('abort', finish, { once: true });

    function finish() {
      clearTimeout(timer);
      signal.removeEventListener('abort', finish);
      resolve();
    }
  });
}

export async function pollJob(
  jobId: string,
  onUpdate: (job: RenderJob) => void,
  signal: AbortSignal,
): Promise<void> {
  try {
    while (!signal.aborted) {
      const job = await getJob(jobId, signal);
      if (signal.aborted) return;

      onUpdate(job);
      if (signal.aborted || (job.status !== 'queued' && job.status !== 'running')) return;

      // Schedule the delay only after the current request finishes.
      await waitForNextPoll(signal);
    }
  } catch (error) {
    if (!signal.aborted) throw error;
  }
}
