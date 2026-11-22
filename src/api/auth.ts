import type { LoginInput, LoginResponse, User, UserResponse } from '../types/auth';
import { API_BASE_URL, ApiError, authorizedFetch, readErrorMessage } from './http';

/** Вход по логину и паролю; пароль нигде не сохраняется и не логируется */
export async function signIn(credentials: LoginInput): Promise<LoginResponse> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        login: credentials.login.trim(),
        password: credentials.password,
      }),
    });
  } catch {
    throw new ApiError(
      'Не удалось подключиться к серверу. Проверьте интернет и повторите попытку.',
      null,
    );
  }

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }

  return (await response.json()) as LoginResponse;
}

/** Текущий пользователь по сохранённому токену */
export async function getCurrentUser(
  token: string,
  onUnauthorized?: () => void | Promise<void>,
): Promise<User> {
  const response = await authorizedFetch('/auth/me', token, undefined, onUnauthorized);

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }

  return ((await response.json()) as UserResponse).user;
}
