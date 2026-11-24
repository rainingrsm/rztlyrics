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

function ResultStatus({ title, message, pending = false, error = false, onRetry }: {
  title: string;
  message?: string;
  pending?: boolean;
  error?: boolean;
  onRetry?: () => void;
}) {
  return (
    <div className="panel result-status">
      <div role={error ? 'alert' : 'status'}>
        <h2 className={pending ? 'progress-label' : undefined}>{title}</h2>
        {message && <p className={error ? 'field-error' : 'muted'}>{message}</p>}
      </div>
      {onRetry && <button className="button" type="button" onClick={onRetry}>Обновить состояние</button>}
    </div>
  );
}

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

  if (state.kind === 'loading') return <ResultStatus title="Загружаем состояние задачи" pending />;
  if (state.kind === 'empty') return <ResultStatus title="Видео ещё не создано" message="Запустите генерацию в редакторе." />;
  if (state.kind === 'error') {
    return (
      <ResultStatus title="Не удалось загрузить состояние" message={state.message} error
        onRetry={state.canRetry ? retry : undefined} />
    );
  }

  const { job } = state;
  switch (job.status) {
    case 'queued':
      return <ResultStatus title="Видео в очереди" message="Статус обновится автоматически." pending />;
    case 'running':
      return <ResultStatus title="Генерируем видео" message="Плеер появится здесь, когда видео будет готово." pending />;
    case 'failed':
      return (
        <ResultStatus title="Не удалось создать видео"
          message={job.error?.message ?? 'Вернитесь к таймингам и запустите генерацию снова.'} error />
      );
    case 'succeeded':
      // TODO(B2): Compare revisions once the job API includes the snapshot revision.
      return job.video_url
        ? <VideoResult videoUrl={job.video_url} jobId={job.id} />
        : <ResultStatus title="Видео недоступно" message="Сервер не вернул ссылку на MP4." error />;
    default:
      return <ResultStatus title="Неизвестное состояние задачи" error />;
  }
}

export function ResultPage() {
  const { id } = useParams();
  const { state: navigationState } = useLocation();
  const jobId = id ? getNavigationJobId(navigationState, id) : null;
  return (
    <section>
      <header className="page-heading heading-with-actions">
        <h1>Результат</h1>
        {id
          ? <Link className="button" to={`/projects/${encodeURIComponent(id)}/edit`}>К таймингам</Link>
          : <Link className="button" to="/">На главную</Link>}
      </header>
      {id && <ProjectResult key={`${id}:${jobId ?? ''}`} projectId={id} initialJobId={jobId} />}
    </section>
  );
}
