/** F1 + B1: DTO меняются вместе с docs/api.md и Python-схемами в одном согласованном PR. */
export interface LyricLine {
  id: string;
  text: string;
  start_ms: number | null;
  end_ms: number | null;
}

export interface LyricsDraft {
  style: 'brat';
  lines: LyricLine[];
}

export interface Project extends LyricsDraft {
  id: string;
  duration_ms: number | null;
  audio_url: string | null;
  latest_job_id: string | null;
  revision: number;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  field?: string | null;
}

export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export interface RenderJob {
  id: string;
  project_id: string;
  status: JobStatus;
  video_url: string | null;
  error: ApiErrorBody | null;
}

export interface QueuedRender {
  job_id: string;
  status: 'queued';
}
