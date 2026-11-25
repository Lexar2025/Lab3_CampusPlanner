import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { getCurrentUser, signIn as apiSignIn } from '../api/auth';
import { ApiError } from '../api/http';
import { queryClient } from '../api/queryClient';
import type { LoginInput, User } from '../types/auth';
import { readToken, removeToken, saveToken } from './authStorage';

const SESSION_CHECK_ERROR =
  'Не удалось проверить сохранённую сессию. Проверьте подключение и войдите снова.';

export interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authNotice: string | null;
  signIn: (credentials: LoginInput) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  const clearSessionOn401 = useCallback(async () => {
    try {
      await removeToken();
    } catch {
      // Даже если хранилище недоступно, состояние сессии нужно очистить.
    }
    setUser(null);
    setAccessToken(null);
    setAuthNotice(null);
    queryClient.clear();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      let token: string | null = null;
      try {
        token = await readToken();
      } catch {
        token = null;
      }

      if (!token) {
        if (!cancelled) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const currentUser = await getCurrentUser(token, clearSessionOn401);
        if (cancelled) {
          return;
        }
        setAccessToken(token);
        setUser(currentUser);
      } catch (error) {
        if (cancelled) {
          return;
        }
        if (error instanceof ApiError && error.status === 401) {
          await clearSessionOn401();
        } else {
          // Сеть или 5xx: токен сохраняем, чтобы сессия восстановилась позже.
          setAuthNotice(SESSION_CHECK_ERROR);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, [clearSessionOn401]);

  const signIn = useCallback(async (credentials: LoginInput) => {
    const data = await apiSignIn(credentials);
    await saveToken(data.accessToken);
    queryClient.clear();
    setAccessToken(data.accessToken);
    setUser(data.user);
    setAuthNotice(null);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await removeToken();
    } catch {
      // Ошибка удаления не должна оставлять пользователя в «авторизованном» состоянии.
    }
    setAccessToken(null);
    setUser(null);
    setAuthNotice(null);
    queryClient.clear();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isLoading,
      isAuthenticated: Boolean(user && accessToken),
      authNotice,
      signIn,
      signOut,
    }),
    [user, accessToken, isLoading, authNotice, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
