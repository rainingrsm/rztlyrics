import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { request } from './client';
import { createRender, getJob } from './projects';

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('API error responses', () => {
  it.each([null, 'file'])('preserves the error field %s in a server response', async (field) => {
    const details = { code: 'INVALID_DATA', message: 'Проверьте данные', field };
    fetchMock.mockResolvedValueOnce(Response.json({ error: details }, { status: 422 }));

    await expect(request('/projects/p1/audio')).rejects.toMatchObject({ status: 422, details });
  });

  it('returns an HTTP error for a proxy response without JSON', async () => {
    fetchMock.mockResolvedValueOnce(new Response('<p>Bad Gateway</p>', { status: 502 }));

    await expect(request('/projects')).rejects.toMatchObject({
      status: 502, details: { code: 'HTTP_ERROR', message: 'Ошибка сервера: 502' },
    });
  });

  it('preserves cancellation while reading an error response body', async () => {
    const controller = new AbortController();
    const response = new Response(null, { status: 503 });
    vi.spyOn(response, 'json').mockImplementationOnce(async () => {
      controller.abort();
      throw controller.signal.reason;
    });
    fetchMock.mockResolvedValueOnce(response);

    await expect(request('/jobs/j1', { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
  });

  it.each([409, 429, 503])('returns a render POST error %s without retrying', async (status) => {
    const details = { code: 'RENDER_UNAVAILABLE', message: 'Запуск пока недоступен', field: null };
    fetchMock.mockResolvedValueOnce(Response.json({ error: details }, { status }));

    await expect(createRender('p1')).rejects.toMatchObject({ status, details });
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith('/api/v1/projects/p1/renders', expect.objectContaining({ method: 'POST' }));
  });

  it('returns an unknown job 404 from a read-only request', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({
      error: { code: 'NOT_FOUND', message: 'Задание не найдено' },
    }, { status: 404 }));

    await expect(getJob('j1')).rejects.toMatchObject({ status: 404 });
    expect(fetchMock.mock.calls.map(([url, options]) => [url, options?.method ?? 'GET'])).toEqual([
      ['/api/v1/jobs/j1', 'GET'],
    ]);
  });
});
