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
    <section className="hero">
      <p className="eyebrow">Музыка становится видео</p>
      <h1>Твой трек.<br /><span>Твои строки.</span></h1>
      <p className="intro">Загрузите аудио, расставьте время появления строк и создайте lyrics-видео в стиле Brat.</p>
      <form className="panel upload-panel" onSubmit={submit}>
        <h2>Начните с трека</h2>
        <p>MP3 или WAV · до 20 MiB · от 5 до 60 секунд</p>
        <label htmlFor="audio-file">Аудиофайл</label>
        <input
          id="audio-file"
          type="file"
          accept=".mp3,.wav,audio/mpeg,audio/wav"
          aria-invalid={Boolean(fileError)}
          aria-describedby={fileError ? 'audio-file-error' : undefined}
          disabled={uploading}
          onChange={selectFile}
        />
        <FieldError id="audio-file-error" message={fileError} />
        <button type="submit" disabled={!file || Boolean(fileError) || uploading}>
          Загрузить трек
        </button>
        <span className="upload-status" role="status">{uploading ? 'Загружаем…' : ''}</span>
        <FieldError id="upload-error" message={submitError} />
      </form>
      <ol className="steps"><li>Загрузите аудио</li><li>Введите текст и тайминги</li><li>Получите MP4</li></ol>
    </section>
  );
}
