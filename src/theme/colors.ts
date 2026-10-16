export type ThemeMode = 'light' | 'dark';

export interface Palette {
  background: string;
  card: string;
  text: string;
  subtext: string;
  primary: string;
  onPrimary: string;
  border: string;
  danger: string;
  success: string;
  warning: string;
}

export const lightPalette: Palette = {
  background: '#F4F6FA',
  card: '#FFFFFF',
  text: '#111827',
  subtext: '#6B7280',
  primary: '#2563EB',
  onPrimary: '#FFFFFF',
  border: '#E5E7EB',
  danger: '#DC2626',
  success: '#16A34A',
  warning: '#D97706',
};

export const darkPalette: Palette = {
  background: '#0F172A',
  card: '#1E293B',
  text: '#F1F5F9',
  subtext: '#94A3B8',
  primary: '#3B82F6',
  onPrimary: '#FFFFFF',
  border: '#334155',
  danger: '#F87171',
  success: '#4ADE80',
  warning: '#FBBF24',
};

export const palettes: Record<ThemeMode, Palette> = {
  light: lightPalette,
  dark: darkPalette,
};
