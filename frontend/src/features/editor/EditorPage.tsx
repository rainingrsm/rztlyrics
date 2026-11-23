import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../../shared/api/client';
import { getProject } from '../../shared/api/projects';
import type { LyricsDraft, Project } from '../../shared/types/project';
import { TimingTable } from './TimingTable';

type EditorState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; project: Project; draft: LyricsDraft; dirty: boolean };

export function EditorPage() {
  const { id } = useParams();
  return (
    <section className="panel">
      <p className="eyebrow">Шаг 2 · текст и тайминги</p>
      <h1>Подготовка видео</h1>
      {id ? <ProjectEditor key={id} projectId={id} /> : (
        <>
          <p role="alert">В адресе не указан проект.</p>
          <Link to="/">На главную</Link>
        </>
      )}
    </section>
  );
}

function ProjectEditor({ projectId }: { projectId: string }) {
  const [state, setState] = useState<EditorState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();

    void getProject(projectId, controller.signal).then((project) => {
      // Ignore a response that arrives after the editor has been closed or reset.
      if (controller.signal.aborted) return;
      setState({
        status: 'loaded',
        project,
        draft: { style: project.style, lines: project.lines.map((line) => ({ ...line })) },
        dirty: false,
      });
    }, (error: unknown) => {
      if (controller.signal.aborted) return;
      let message = 'Не удалось загрузить проект. Проверьте подключение и обновите страницу.';
      if (error instanceof ApiError) {
        message = error.status === 404 ? 'Проект не найден или недоступен.' : error.message;
      }
      setState({ status: 'error', message });
    });

    return () => controller.abort();
  }, [projectId]);

  if (state.status === 'loading') return <p role="status">Загружаем проект…</p>;
  if (state.status === 'error') {
    return (
      <>
        <p role="alert">{state.message}</p>
        <Link to="/">На главную</Link>
      </>
    );
  }

  return (
    <>
      <label htmlFor="lyrics-input">Текст песни — каждая строка отдельно</label>
      <textarea id="lyrics-input" rows={5} value={state.draft.lines.map((line) => line.text).join('\n')} readOnly />
      <button type="button" disabled>Разбить на строки</button>
      <TimingTable />
      <div className="actions"><button type="button" disabled>Сохранить</button><button type="button" disabled>Сгенерировать видео</button></div>
    </>
  );
}
