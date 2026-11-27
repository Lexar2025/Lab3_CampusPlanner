import * as SecureStore from 'expo-secure-store';

export const ACCESS_TOKEN_KEY = 'campus_planner.access_token';

export function saveToken(token: string): Promise<void> {
  return SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

export function readToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export function removeToken(): Promise<void> {
  return SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
}
