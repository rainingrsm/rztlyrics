import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../shared/api/client';
import { getProject, saveLyrics } from '../../shared/api/projects';
import { LIMITS } from '../../shared/limits';
import type { LyricsDraft, Project } from '../../shared/types/project';
import { FieldError } from '../../shared/ui/FieldError';
import { useUnsavedChanges } from '../../shared/ui/useUnsavedChanges';
import { AudioPlayer } from './AudioPlayer';
import { saveAndStartRender, splitLyrics } from './lyrics';
import { msToSeconds } from './time';
import { TimingTable } from './TimingTable';
import { validateDraftLines, validateRenderLines, type TimingIssue } from './validation';

type EditorState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
    status: 'loaded';
    project: Project;
    draft: LyricsDraft;
    dirty: boolean;
    lyricsInput: string;
    appliedLyricsInput: string;
  };

type OperationFeedback = { status: 'saving' | 'saved' | 'starting' } | { status: 'error'; message: string };

function copyDraft(project: Project): LyricsDraft {
  return { style: project.style, lines: project.lines.map((line) => ({ ...line })) };
}

function validationFocusId(field: string): string | undefined {
  if (field === 'duration_ms') return 'editor-audio';
  if (field === 'lines') return 'lyrics-input';
  const row = /^lines\[(\d+)\](?:\.(text|id|start_ms|end_ms))?$/.exec(field);
  if (!row) return undefined;

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
  const navigate = useNavigate();
  const editorRef = useRef<HTMLFieldSetElement>(null);
  const activeOperation = useRef<AbortController | null>(null);
  const [state, setState] = useState<EditorState>({ status: 'loading' });
  const [lyricsError, setLyricsError] = useState<string>();
  const [currentTimeMs, setCurrentTimeMs] = useState<number | null>(null);
  const [renderIssues, setRenderIssues] = useState<TimingIssue[] | null>(null);
  const [operationFeedback, setOperationFeedback] = useState<OperationFeedback>();
  const [showResult, setShowResult] = useState(false);
  const hasUnappliedLyrics = state.status === 'loaded' && state.lyricsInput !== state.appliedLyricsInput;

  useUnsavedChanges(state.status === 'loaded' && (state.dirty || hasUnappliedLyrics));

  useEffect(() => {
    // Let the router clear the editor's blocker before opening the saved result.
    if (showResult) void navigate(`/projects/${encodeURIComponent(projectId)}/result`);
  }, [navigate, projectId, showResult]);

  useEffect(() => {
    const controller = new AbortController();

    void getProject(projectId, controller.signal).then((project) => {
      // Ignore a response that arrives after the editor has been closed or reset.
      if (controller.signal.aborted) return;
      const lyricsInput = project.lines.map((line) => line.text).join('\n');
      setState({
        status: 'loaded',
        project,
        draft: copyDraft(project),
        dirty: false,
        lyricsInput,
        appliedLyricsInput: lyricsInput,
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

  useEffect(() => () => activeOperation.current?.abort(), []);

  useEffect(() => {
    const firstIssue = renderIssues?.[0];
    const id = firstIssue && validationFocusId(firstIssue.field);
    if (id) document.getElementById(id)?.focus();
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
    clearDraftFeedback();
    setState({ ...state, draft: { ...state.draft, lines }, dirty: true, appliedLyricsInput: state.lyricsInput });
  }

  function clearDraftFeedback() {
    setRenderIssues(null);
    setOperationFeedback(undefined);
  }

  function focusInvalidTimingInput(): boolean {
    // The last committed time can still be valid while the field contains invalid text.
    const invalidInput = editorRef.current?.querySelector<HTMLInputElement>('input:invalid');
    invalidInput?.focus();
    return Boolean(invalidInput);
  }

  function focusUnappliedLyrics(): boolean {
    if (!hasUnappliedLyrics) return false;
    setLyricsError('Нажмите «Разбить на строки», чтобы применить новый текст.');
    document.getElementById('lyrics-input')?.focus();
    return true;
  }

  function beginOperation(status: 'saving' | 'starting'): AbortController {
    const controller = new AbortController();
    activeOperation.current = controller;
    setRenderIssues(null);
    setOperationFeedback({ status });
    return controller;
  }

  function acceptSavedProject(project: Project) {
    const lyricsInput = project.lines.map((line) => line.text).join('\n');
    setState((current) => current.status === 'loaded' ? {
      ...current,
      project,
      draft: copyDraft(project),
      dirty: false,
      lyricsInput,
      appliedLyricsInput: lyricsInput,
    } : current);
  }

  function showOperationError(error: unknown, fallback: string, draftSaved = false) {
    const detail = error instanceof ApiError ? error.message : fallback;
    const message = draftSaved ? `Черновик сохранён. ${detail}` : detail;
    const field = error instanceof ApiError && error.status === 422 ? error.details.field : undefined;
    const fieldId = field && validationFocusId(field);
    if (field && fieldId && document.getElementById(fieldId)) {
      setOperationFeedback(undefined);
      setRenderIssues([{ field, message }]);
    } else {
      setOperationFeedback({ status: 'error', message });
    }
  }

  async function handleSave() {
    if (state.status !== 'loaded' || activeOperation.current || focusUnappliedLyrics() || focusInvalidTimingInput()) return;
    const issues = validateDraftLines(state.draft.lines, state.project.duration_ms);
    if (issues.length) {
      setRenderIssues(issues);
      return;
    }

    const operation = beginOperation('saving');
    try {
      const project = await saveLyrics(state.project.id, state.draft);
      if (operation.signal.aborted) return;
      acceptSavedProject(project);
      setOperationFeedback({ status: 'saved' });
    } catch (error) {
      if (!operation.signal.aborted) showOperationError(error, 'Не удалось сохранить черновик. Повторите попытку.');
    } finally {
      activeOperation.current = null;
    }
  }

  async function handleGenerate() {
    if (state.status !== 'loaded' || activeOperation.current || focusUnappliedLyrics() || focusInvalidTimingInput()) return;
    const issues = validateRenderLines(state.draft.lines, state.project.duration_ms);
    if (issues.length) {
      setRenderIssues(issues);
      return;
    }

    const operation = beginOperation('starting');
    let draftSaved = false;
    try {
      await saveAndStartRender({ ...state.project, ...state.draft }, (project) => {
        draftSaved = true;
        if (!operation.signal.aborted) acceptSavedProject(project);
      });
      // The result page loads the project's latest job so the same URL also works after refresh.
      if (!operation.signal.aborted) setShowResult(true);
    } catch (error) {
      if (!operation.signal.aborted) showOperationError(error, 'Не удалось запустить генерацию.', draftSaved);
    } finally {
      activeOperation.current = null;
    }
  }

  const audioError = renderIssues?.find(({ field }) => field === 'duration_ms')?.message;
  const lyricsMessage = lyricsError ?? renderIssues?.find(({ field }) => field === 'lines')?.message;
  const isBusy = operationFeedback?.status === 'saving' || operationFeedback?.status === 'starting';

  return (
    <fieldset className="editor-fields" ref={editorRef} disabled={isBusy}>
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
          clearDraftFeedback();
          setState({ ...state, lyricsInput: event.target.value });
        }}
      />
      <FieldError id="lyrics-error" message={lyricsMessage} />
      <div className="actions">
        <button type="button" onClick={handleSplitLyrics}>Разбить на строки</button>
        <button type="button" onClick={() => void handleSave()}>Сохранить</button>
        <button type="button" onClick={() => void handleGenerate()}>Сгенерировать видео</button>
      </div>
      {operationFeedback?.status === 'saving' && <p role="status">Сохраняем черновик…</p>}
      {operationFeedback?.status === 'saved' && <p role="status">Черновик сохранён.</p>}
      {operationFeedback?.status === 'starting' && <p role="status">Сохраняем черновик и запускаем генерацию…</p>}
      <FieldError id="editor-operation-error" message={operationFeedback?.status === 'error' ? operationFeedback.message : undefined} />
      <TimingTable
        lines={state.draft.lines}
        durationMs={state.project.duration_ms}
        currentTimeMs={currentTimeMs}
        issues={renderIssues ?? []}
        onTimingInput={() => {
          clearDraftFeedback();
          if (!state.dirty) setState({ ...state, dirty: true });
        }}
        onChange={(lines) => {
          clearDraftFeedback();
          setState({ ...state, draft: { ...state.draft, lines }, dirty: true });
        }}
      />
    </fieldset>
  );
}
