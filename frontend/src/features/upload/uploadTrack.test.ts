import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Project } from '../../shared/types/project';
import { uploadTrack } from './uploadTrack';

const project: Project = {
  id: 'project-1',
  style: 'brat',
  duration_ms: null,
  audio_url: null,
  lines: [],
  latest_job_id: null,
  revision: 0,
};
const uploaded = { ...project, duration_ms: 8_000, audio_url: '/api/v1/projects/project-1/audio' };
const file = new File(['audio'], 'track.WAV');
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('uploadTrack', () => {
  it('uploads the original file only after project creation succeeds', async () => {
    const { signal } = new AbortController();
    fetchMock.mockResolvedValueOnce(Response.json(project, { status: 201 }))
      .mockResolvedValueOnce(Response.json(uploaded));

    const result = uploadTrack(file, { signal });
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith('/api/v1/projects', expect.objectContaining({
      method: 'POST', signal, credentials: 'same-origin',
    }));
    await expect(result).resolves.toEqual(uploaded);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, request] = fetchMock.mock.calls[1];
    expect(url).toBe('/api/v1/projects/project-1/audio');
    expect(request).toMatchObject({ method: 'POST', signal, credentials: 'same-origin' });
    expect(request?.body).toBeInstanceOf(FormData);
    expect((request?.body as FormData).get('file')).toBe(file);
    expect(new Headers(request?.headers).has('Content-Type')).toBe(false);
  });

  it('rejects an invalid file before any API call', async () => {
    await expect(uploadTrack(new File(['audio'], 'track.mp3.exe'))).rejects.toThrow('MP3 или WAV');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('surfaces a server error on creation and skips the audio request', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({
      error: { code: 'NOT_IMPLEMENTED', message: 'Создание пока недоступно' },
    }, { status: 501 }));

    await expect(uploadTrack(file)).rejects.toMatchObject({
      status: 501, message: 'Создание пока недоступно',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('can reuse a known project and propagates an upload rejection without retrying', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({
      error: { code: 'UNSUPPORTED_AUDIO', message: 'Формат не поддерживается', field: 'file' },
    }, { status: 415 }));
    const onProjectReady = vi.fn();

    await expect(uploadTrack(file, { projectId: project.id, onProjectReady })).rejects.toMatchObject({
      status: 415, details: { field: 'file' },
    });
    expect(onProjectReady).toHaveBeenCalledExactlyOnceWith(project.id);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith('/api/v1/projects/project-1/audio', expect.anything());
  });

  it('rejects a response without confirmed audio data', async () => {
    fetchMock.mockResolvedValueOnce(Response.json(project));
    await expect(uploadTrack(file, { projectId: project.id })).rejects.toThrow('не подтвердил');
  });

  it('does not start upload if cancelled during project creation', async () => {
    const controller = new AbortController();
    fetchMock.mockResolvedValueOnce(Response.json(project, { status: 201 }));

    const result = uploadTrack(file, { signal: controller.signal });
    controller.abort();

    await expect(result).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
