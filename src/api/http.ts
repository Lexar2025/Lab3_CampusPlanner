import type { ApiErrorResponse } from '../types/auth';

const DEFAULT_API_BASE_URL = 'https://campus-api.mkseva.workers.dev';

export const API_BASE_URL: string =
  (process.env.EXPO_PUBLIC_API_URL ?? '').trim().replace(/\/+$/, '') ||
  DEFAULT_API_BASE_URL;

/** Ошибка обращения к Campus API; status = null для сетевой ошибки */
export class ApiError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Читает сообщение из JSON-тела ошибки, иначе возвращает общий текст */
export async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as Partial<ApiErrorResponse> | null;
    if (data && typeof data.error === 'string' && data.error.trim()) {
      return data.error;
    }
  } catch {
    // Тело ответа не является JSON — используем общий текст ниже.
  }

  return `Ошибка сервера (${response.status}).`;
}

/**
 * Запрос к Campus API с токеном.
 * onUnauthorized вызывается только при HTTP 401; сетевые исключения
 * пробрасываются дальше без вызова колбэка.
 */
export async function authorizedFetch(
  path: string,
  token: string,
  init?: RequestInit,
  onUnauthorized?: () => void | Promise<void>,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${token}`);

  if (init?.body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  if (response.status === 401 && onUnauthorized) {
    await onUnauthorized();
  }

  return response;
}
