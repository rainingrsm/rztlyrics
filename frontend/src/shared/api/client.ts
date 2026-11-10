import type { ApiErrorBody } from '../types/project';

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly details: ApiErrorBody) {
    super(details.message);
    this.name = 'ApiError';
  }
}

/** F1: JSON-запрос с сессией. HTTP-ошибка сохраняет code/field; AbortSignal отменяет опрос. */
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (typeof options.body === 'string') headers.set('Content-Type', 'application/json');
  // Для FormData браузер сам добавляет Content-Type с корректным boundary.
  const response = await fetch(`/api/v1${path}`, { ...options, headers, credentials: 'same-origin' });
  if (!response.ok) {
    let details: ApiErrorBody = { code: 'HTTP_ERROR', message: `Ошибка сервера: ${response.status}` };
    try {
      const body: unknown = await response.json();
      if (body && typeof body === 'object' && 'error' in body) {
        const error = body.error;
        if (error && typeof error === 'object' && 'code' in error && 'message' in error
          && typeof error.code === 'string' && typeof error.message === 'string') {
          details = { code: error.code, message: error.message };
          if ('field' in error && typeof error.field === 'string') details.field = error.field;
        }
      }
    } catch { /* Прокси может вернуть HTML; сохраняем понятную HTTP-ошибку. */ }
    throw new ApiError(response.status, details);
  }
  return response.json() as Promise<T>;
}
