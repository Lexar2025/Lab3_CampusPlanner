import { createContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { palettes, type Palette, type ThemeMode } from '../theme/colors';

const THEME_KEY = '@campus_planner/theme';

export interface ThemeContextValue {
  theme: ThemeMode;
  colors: Palette;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>('light');

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_KEY);
        if (stored === 'light' || stored === 'dark') {
          setTheme(stored);
        }
      } catch (e) {
        console.warn('Не удалось загрузить тему:', e);
      }
    })();
  }, []);

  const toggleTheme = async () => {
    const next: ThemeMode = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    try {
      await AsyncStorage.setItem(THEME_KEY, next);
    } catch (e) {
      console.warn('Не удалось сохранить тему:', e);
    }
  };

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, colors: palettes[theme], toggleTheme }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
