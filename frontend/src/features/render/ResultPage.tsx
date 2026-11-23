import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ApiError } from '../../shared/api/client';
import { getProject } from '../../shared/api/projects';
import type { RenderJob } from '../../shared/types/project';
import { pollJob } from './pollJob';
import { VideoResult } from './VideoResult';

export interface ResultNavigationState {
  projectId: string;
  jobId: string;
}

type ResultState =
  | { kind: 'loading' }
  | { kind: 'empty' }
  | { kind: 'job'; job: RenderJob }
  | { kind: 'error'; message: string; canRetry: boolean };

function getNavigationJobId(state: unknown, projectId: string): string | null {
  if (state && typeof state === 'object' && 'projectId' in state && state.projectId === projectId
    && 'jobId' in state && typeof state.jobId === 'string' && state.jobId.trim()) {
    return state.jobId;
  }
  return null;
}

function ProjectResult({ projectId, initialJobId }: { projectId: string; initialJobId: string | null }) {
  const knownJobId = useRef(initialJobId);
  const [state, setState] = useState<ResultState>({ kind: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    async function loadResult() {
      try {
        // A retry resumes the same job if its ID is already known.
        const jobId = knownJobId.current ?? (await getProject(projectId, signal)).latest_job_id;
        if (signal.aborted) return;
        if (!jobId) {
          setState({ kind: 'empty' });
          return;
        }

        knownJobId.current = jobId;
        await pollJob(jobId, (job) => {
          if (job.id !== jobId || job.project_id !== projectId) {
            throw new ApiError(404, { code: 'NOT_FOUND', message: 'Задача не найдена или недоступна.' });
          }
          setState({ kind: 'job', job });
        }, signal);
      } catch (error) {
        if (signal.aborted) return;
        if (error instanceof ApiError) {
          setState({ kind: 'error', message: error.message, canRetry: error.status !== 404 });
        } else {
          setState({ kind: 'error', message: 'Не удалось загрузить состояние. Проверьте подключение.', canRetry: true });
        }
      }
    }

    void loadResult();
    return () => controller.abort();
  }, [projectId, attempt]);

  function retry() {
    setState({ kind: 'loading' });
    setAttempt((previous) => previous + 1);
  }

  if (state.kind === 'loading') return <p role="status">Загружаем состояние задачи…</p>;
  if (state.kind === 'empty') return <p role="status">Откройте редактор, чтобы начать генерацию.</p>;
  if (state.kind === 'error') {
    return (
      <>
        <p className="field-error" role="alert">{state.message}</p>
        {state.canRetry && <button type="button" onClick={retry}>Обновить состояние</button>}
      </>
    );
  }

  const { job } = state;
  switch (job.status) {
    case 'queued':
      return <p role="status">Видео ждёт своей очереди.</p>;
    case 'running':
      return <p role="status">Генерируем видео…</p>;
    case 'failed':
      return (
        <>
          <p className="field-error" role="alert">{job.error?.message ?? 'Не удалось сгенерировать видео.'}</p>
          <p>Вернитесь в редактор, чтобы проверить черновик и запустить генерацию снова.</p>
        </>
      );
    case 'succeeded':
      // TODO(B2): Compare revisions once the job API includes the snapshot revision.
      return job.video_url
        ? <VideoResult videoUrl={job.video_url} jobId={job.id} />
        : <p className="field-error" role="alert">Видео готово, но сервер не вернул ссылку.</p>;
    default:
      return <p className="field-error" role="alert">Сервер вернул неизвестное состояние задачи.</p>;
  }
}

export function ResultPage() {
  const { id } = useParams();
  const { state: navigationState } = useLocation();
  const jobId = id ? getNavigationJobId(navigationState, id) : null;
  return (
    <section className="panel">
      <p className="eyebrow">Шаг 3 · результат</p>
      <h1>Результат генерации</h1>
      {id && <ProjectResult key={`${id}:${jobId ?? ''}`} projectId={id} initialJobId={jobId} />}
      <div className="actions">
        {id
          ? <Link to={`/projects/${encodeURIComponent(id)}/edit`}>Вернуться к редактору</Link>
          : <Link to="/">На главную</Link>}
      </div>
    </section>
  );
}
