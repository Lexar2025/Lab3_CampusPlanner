/** Пользователь Campus API */
export interface User {
  id: string;
  login: string;
  name: string;
}

/** Тело запроса POST /auth/login */
export interface LoginInput {
  login: string;
  password: string;
}

/** Ответ POST /auth/login */
export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: User;
}

/** Ответ GET /auth/me */
export interface UserResponse {
  user: User;
}

/** Тело ошибки Campus API */
export interface ApiErrorResponse {
  error: string;
}
