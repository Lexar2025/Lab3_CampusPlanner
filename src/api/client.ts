import { ApiError, authorizedFetch, readErrorMessage } from './http';

const NETWORK_ERROR =
  'Не удалось подключиться к серверу. Проверьте интернет и повторите попытку.';
const INVALID_RESPONSE_ERROR = 'Сервер вернул некорректный ответ. Попробуйте ещё раз.';
const UNKNOWN_ERROR = 'Не удалось выполнить запрос. Попробуйте ещё раз.';

/**
 * Запрос к Campus API с токеном и разбором JSON.
 * 204 возвращает undefined; сетевая ошибка и битый JSON превращаются в ApiError.
 */
export async function apiRequest<T>(
  path: string,
  token: string,
  init?: RequestInit,
  onUnauthorized?: () => void | Promise<void>,
): Promise<T> {
  let response: Response;

  try {
    response = await authorizedFetch(path, token, init, onUnauthorized);
  } catch {
    throw new ApiError(NETWORK_ERROR, null);
  }

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError(INVALID_RESPONSE_ERROR, response.status);
  }
}

/** Ошибка означает недействительную сессию */
export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

/** Человекочитаемое сообщение ошибки без сырого текста сервера */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case null:
        return NETWORK_ERROR;
      case 400:
        return 'Проверьте введённые данные.';
      case 401:
        return 'Сессия истекла. Войдите снова.';
      case 403:
        return 'Нет доступа к этой операции.';
      case 404:
        return 'Запись не найдена.';
      case 429:
        return 'Слишком много запросов. Попробуйте позже.';
      default:
        if (error.status !== null && error.status >= 500) {
          return 'Сервер временно недоступен. Попробуйте позже.';
        }
        return UNKNOWN_ERROR;
    }
  }
  return UNKNOWN_ERROR;
}

/** Сообщение об ошибке входа без сырого текста сервера */
export function getLoginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return 'Неверный логин или пароль.';
    }
    if (error.status === 400) {
      return 'Проверьте логин и пароль.';
    }
  }
  return getErrorMessage(error);
}
