import { createProject, uploadAudio } from '../../shared/api/projects';
import type { Project } from '../../shared/types/project';
import { validateAudioFile } from './validation';

interface UploadOptions {
  projectId?: string;
  onProjectReady?: (projectId: string) => void;
  signal?: AbortSignal;
}

export async function uploadTrack(file: File, { projectId, onProjectReady, signal }: UploadOptions = {}): Promise<Project> {
  signal?.throwIfAborted();
  const message = validateAudioFile(file);
  if (message) throw new Error(message);

  const id = projectId ?? (await createProject(signal)).id;
  signal?.throwIfAborted();
  // Keep the project ID available if the audio request fails.
  onProjectReady?.(id);
  const project = await uploadAudio(id, file, signal);
  if (!project.audio_url || project.duration_ms === null) {
    throw new Error('Сервер не подтвердил загрузку аудио.');
  }
  return project;
}
