import * as SecureStore from 'expo-secure-store';

/** Ключ SecureStore: допустимы только латиница, цифры, '.', '-', '_' */
export const ACCESS_TOKEN_KEY = 'campus_planner.access_token';

/** Сохраняет токен в защищённое хранилище устройства */
export function saveToken(token: string): Promise<void> {
  return SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

/** Читает сохранённый токен; null, если токена нет */
export function readToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

/** Удаляет сохранённый токен */
export function removeToken(): Promise<void> {
  return SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
}
