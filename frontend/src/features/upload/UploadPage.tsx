import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../shared/api/client';
import { getProject } from '../../shared/api/projects';
import { FieldError } from '../../shared/ui/FieldError';
import { uploadTrack } from './uploadTrack';
import { validateAudioFile } from './validation';

export function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>();
  const [submitError, setSubmitError] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const inFlight = useRef<AbortController | null>(null);
  const pendingUpload = useRef<{ id: string; file: File } | null>(null);

  useEffect(() => () => { inFlight.current?.abort(); }, []);

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.currentTarget.files?.[0] ?? null;
    setFile(selected);
    setFileError(selected ? (validateAudioFile(selected) ?? undefined) : undefined);
    setSubmitError(undefined);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || !file || fileError) return;

    const controller = new AbortController();
    const { signal } = controller;
    inFlight.current = controller;
    setUploading(true);
    setSubmitError(undefined);

    try {
      let projectId: string | undefined;
      const pending = pendingUpload.current;
      if (pending) {
        // Check whether the previous request saved the audio before sending it again.
        const existing = await getProject(pending.id, signal);
        signal.throwIfAborted();
        if (existing.audio_url && existing.duration_ms !== null) {
          if (pending.file === file) {
            navigate(`/projects/${encodeURIComponent(existing.id)}/edit`);
            return;
          }
          pendingUpload.current = null;
        } else {
          projectId = existing.id;
        }
      }

      const project = await uploadTrack(file, {
        projectId,
        signal,
        onProjectReady: (id) => { pendingUpload.current = { id, file }; },
      });
      signal.throwIfAborted();
      navigate(`/projects/${encodeURIComponent(project.id)}/edit`);
    } catch (error) {
      if (signal.aborted) return;
      if (error instanceof ApiError) {
        if (error.status === 404) pendingUpload.current = null;
        if (error.status === 413 || error.status === 415 || error.details.field === 'file') {
          setFileError(error.message);
        } else {
          setSubmitError(error.message);
        }
      } else if (error instanceof TypeError) {
        setSubmitError('Не удалось подтвердить загрузку. Проверьте подключение и попробуйте ещё раз.');
      } else if (error instanceof Error) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Не удалось загрузить аудио.');
      }
    } finally {
      inFlight.current = null;
      if (!signal.aborted) setUploading(false);
    }
  }

  return (
    <section>
      <header className="page-heading">
        <h1>Новый проект</h1>
        <p>Загрузите трек, чтобы разметить текст по времени.</p>
      </header>
      <div className="upload-layout">
        <form className="panel upload-panel" onSubmit={submit} aria-busy={uploading}>
          <span className="audio-mark" aria-hidden="true"><i /><i /><i /><i /><i /></span>
          <h2 className="upload-label">Аудиофайл</h2>
          <p className="muted" id="audio-file-help">MP3 или WAV · до 20 МиБ · 5–60 с</p>
          <label className="file-picker">
            <input
              id="audio-file"
              className="sr-only"
              type="file"
              accept=".mp3,.wav,audio/mpeg,audio/wav"
              aria-invalid={Boolean(fileError)}
              aria-describedby={fileError ? 'audio-file-help audio-file-error' : 'audio-file-help'}
              disabled={uploading}
              onChange={selectFile}
            />
            <span className={`button${file ? '' : ' button-primary'}`}>{file ? 'Заменить файл' : 'Выбрать файл'}</span>
          </label>
          {file && <p className="file-name" role="status">{file.name}</p>}
          <FieldError id="audio-file-error" message={fileError} />
          {file && (
            <button className="button button-primary" type="submit" disabled={Boolean(fileError) || uploading}>
              {uploading ? 'Загружаем…' : 'Загрузить трек'}
            </button>
          )}
          <span className="sr-only" role="status">{uploading ? 'Загружаем аудио.' : ''}</span>
          <FieldError id="upload-error" message={submitError} />
        </form>
        <figure className="media-frame">
          <div className="brat-preview">после полуночи</div>
          <figcaption><span>Пример кадра Brat</span><span className="timecode">9:16</span></figcaption>
        </figure>
      </div>
    </section>
  );
}
