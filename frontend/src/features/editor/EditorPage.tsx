import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../../shared/api/client';
import { getProject } from '../../shared/api/projects';
import { LIMITS } from '../../shared/limits';
import type { LyricsDraft, Project } from '../../shared/types/project';
import { FieldError } from '../../shared/ui/FieldError';
import { AudioPlayer } from './AudioPlayer';
import { splitLyrics } from './lyrics';
import { msToSeconds } from './time';
import { TimingTable } from './TimingTable';
import { validateRenderLines, type TimingIssue } from './validation';

type EditorState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; project: Project; draft: LyricsDraft; dirty: boolean; lyricsInput: string };

function validationFocusId(field: string): string {
  if (field === 'duration_ms') return 'editor-audio';
  const row = /^lines\[(\d+)\](?:\.(text|id|start_ms|end_ms))?$/.exec(field);
  if (!row) return 'lyrics-input';

  const index = Number(row[1]) + 1;
  if (row[2] === 'text' || row[2] === 'id') return `timing-text-${index}`;
  return row[2] === 'end_ms' ? `timing-end-${index}` : `timing-start-${index}`;
}

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
  const editorRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<EditorState>({ status: 'loading' });
  const [lyricsError, setLyricsError] = useState<string>();
  const [currentTimeMs, setCurrentTimeMs] = useState<number | null>(null);
  const [renderIssues, setRenderIssues] = useState<TimingIssue[] | null>(null);

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
        lyricsInput: project.lines.map((line) => line.text).join('\n'),
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

  useEffect(() => {
    const firstIssue = renderIssues?.[0];
    if (firstIssue) document.getElementById(validationFocusId(firstIssue.field))?.focus();
  }, [renderIssues]);

  if (state.status === 'loading') return <p role="status">Загружаем проект…</p>;
  if (state.status === 'error') {
    return (
      <>
        <p role="alert">{state.message}</p>
        <Link to="/">На главную</Link>
      </>
    );
  }

  function handleSplitLyrics() {
    if (state.status !== 'loaded') return;

    const lines = splitLyrics(state.lyricsInput);
    if (lines.length === 0) {
      setLyricsError('Введите хотя бы одну непустую строку.');
      return;
    }
    if (lines.length > LIMITS.maxLines) {
      setLyricsError(`Введите не больше ${LIMITS.maxLines} строк.`);
      return;
    }
    const tooLongIndex = lines.findIndex((line) => [...line.text].length > LIMITS.maxTextLength);
    if (tooLongIndex !== -1) {
      setLyricsError(`Строка ${tooLongIndex + 1} должна содержать не больше ${LIMITS.maxTextLength} символов.`);
      return;
    }

    const hasTimings = state.draft.lines.some((line) => line.start_ms !== null || line.end_ms !== null);
    if (hasTimings && !window.confirm('Разбить текст заново? Текущие тайминги будут удалены.')) return;

    setLyricsError(undefined);
    setRenderIssues(null);
    setState({ ...state, draft: { ...state.draft, lines }, dirty: true });
  }

  function handleValidateRender() {
    if (state.status !== 'loaded') return;

    // A field can still contain invalid text even when its last committed time is valid.
    const invalidInput = editorRef.current?.querySelector<HTMLInputElement>('input:invalid');
    if (invalidInput) {
      setRenderIssues(null);
      invalidInput.focus();
      return;
    }
    setRenderIssues(validateRenderLines(state.draft.lines, state.project.duration_ms));
  }

  const audioError = renderIssues?.find(({ field }) => field === 'duration_ms')?.message;
  const lyricsMessage = lyricsError ?? renderIssues?.find(({ field }) => field === 'lines')?.message;

  return (
    <div ref={editorRef}>
      <div id="editor-audio" role="group" aria-label="Аудиодорожка" tabIndex={-1}
        aria-describedby={audioError ? 'editor-audio-error' : undefined}>
        <AudioPlayer audioUrl={state.project.audio_url} onTimeChange={setCurrentTimeMs} />
        <FieldError id="editor-audio-error" message={audioError} />
      </div>
      {currentTimeMs !== null && <p className="muted">Позиция для разметки — {msToSeconds(currentTimeMs)} с</p>}
      <label htmlFor="lyrics-input">Текст песни — каждая строка отдельно</label>
      <textarea
        id="lyrics-input"
        rows={5}
        value={state.lyricsInput}
        aria-invalid={Boolean(lyricsMessage)}
        aria-describedby={lyricsMessage ? 'lyrics-error' : undefined}
        onChange={(event) => {
          setLyricsError(undefined);
          setRenderIssues(null);
          setState({ ...state, lyricsInput: event.target.value });
        }}
      />
      <FieldError id="lyrics-error" message={lyricsMessage} />
      <div className="actions">
        <button type="button" onClick={handleSplitLyrics}>Разбить на строки</button>
        <button type="button" disabled>Сохранить</button>
        <button type="button" onClick={handleValidateRender}>Проверить разметку</button>
      </div>
      {renderIssues?.length === 0 && <p role="status">Проверка таймингов пройдена.</p>}
      <TimingTable
        lines={state.draft.lines}
        durationMs={state.project.duration_ms}
        currentTimeMs={currentTimeMs}
        issues={renderIssues ?? []}
        onTimingInput={() => setRenderIssues(null)}
        onChange={(lines) => {
          setRenderIssues(null);
          setState({ ...state, draft: { ...state.draft, lines }, dirty: true });
        }}
      />
    </div>
  );
}
