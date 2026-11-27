export interface User {
  id: string;
  login: string;
  name: string;
}

export interface LoginInput {
  login: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: User;
}

export interface UserResponse {
  user: User;
}

export interface ApiErrorResponse {
  error: string;
}
