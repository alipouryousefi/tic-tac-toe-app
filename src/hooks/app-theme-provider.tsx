import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  colorScheme as nativeWindColorScheme,
  useColorScheme as useNativeWindColorScheme,
} from 'nativewind';
import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

import type {
  AppColorScheme,
  AppThemeContextValue,
  AppThemeProviderProps,
} from '@/types/theme.types';

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const systemColorScheme = useSystemColorScheme();
  const { colorScheme: nativeColorScheme } = useNativeWindColorScheme();
  const [preferredTheme, setPreferredTheme] = useState<AppColorScheme | null>(null);
  const [hasHydrated, setHasHydrated] = useState(process.env.EXPO_OS !== 'web');
  const sourceScheme = process.env.EXPO_OS === 'web' ? systemColorScheme : nativeColorScheme;
  const systemTheme = sourceScheme === 'dark' ? 'dark' : 'light';
  const colorScheme = preferredTheme ?? (hasHydrated ? systemTheme : 'light');

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    // Web needs an explicit class; native can follow the system until the first toggle.
    nativeWindColorScheme.set(
      process.env.EXPO_OS === 'web' ? colorScheme : preferredTheme ?? 'system',
    );
  }, [colorScheme, preferredTheme, hasHydrated]);

  const toggleTheme = useCallback(() => {
    const nextTheme = colorScheme === 'dark' ? 'light' : 'dark';
    nativeWindColorScheme.set(nextTheme);
    setPreferredTheme(nextTheme);
  }, [colorScheme]);

  const value = useMemo(() => ({ colorScheme, toggleTheme }), [colorScheme, toggleTheme]);

  return (
    <AppThemeContext value={value}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        {children}
      </ThemeProvider>
    </AppThemeContext>
  );
}

export function useAppTheme() {
  const theme = use(AppThemeContext);

  if (!theme) {
    throw new Error('useAppTheme must be used within AppThemeProvider.');
  }

  return theme;
}
