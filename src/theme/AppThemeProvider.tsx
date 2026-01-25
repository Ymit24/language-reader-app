import { useColorScheme } from '@/hooks/use-color-scheme';
import * as SecureStore from 'expo-secure-store';
import { vars } from 'nativewind';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, View } from 'react-native';
import {
  DEFAULT_DARK_THEME_ID,
  DEFAULT_THEME_ID,
  THEME_BY_ID,
  THEMES,
  type ThemeDefinition,
  type ThemeId,
  type ThemePreference,
  type ThemeVariable,
} from './themes';

export type ThemeColors = Record<ThemeVariable, string>;

type ThemeContextValue = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  theme: ThemeDefinition;
  resolvedThemeId: ThemeId;
  isDark: boolean;
  colors: ThemeColors;
  alpha: (token: ThemeVariable, opacity: number) => string;
  themes: ThemeDefinition[];
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'reader.theme.preference';

const isThemePreference = (value: string | null): value is ThemePreference => {
  if (!value) return false;
  if (value === 'system') return true;
  return Object.prototype.hasOwnProperty.call(THEME_BY_ID, value);
};

const parseRgb = (value: string) => value.split(' ').map((item) => Number(item));

const toRgb = (value: string) => {
  const [r, g, b] = parseRgb(value);
  return `rgb(${r}, ${g}, ${b})`;
};

const toRgba = (value: string, opacity: number) => {
  const [r, g, b] = parseRgb(value);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const createThemeColors = (variables: Record<ThemeVariable, string>): ThemeColors => {
  return Object.fromEntries(
    Object.entries(variables).map(([key, value]) => [key, toRgb(value)])
  ) as ThemeColors;
};

const getStoredPreference = async (): Promise<ThemePreference | null> => {
  try {
    if (Platform.OS === 'web') {
      const stored = globalThis?.localStorage?.getItem(STORAGE_KEY) ?? null;
      return isThemePreference(stored) ? stored : null;
    }
    const stored = await SecureStore.getItemAsync(STORAGE_KEY);
    return isThemePreference(stored) ? stored : null;
  } catch {
    return null;
  }
};

const storePreference = async (value: ThemePreference) => {
  try {
    if (Platform.OS === 'web') {
      globalThis?.localStorage?.setItem(STORAGE_KEY, value);
      return;
    }
    await SecureStore.setItemAsync(STORAGE_KEY, value);
  } catch {
    // ignore storage errors
  }
};

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>(DEFAULT_THEME_ID);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getStoredPreference().then((stored) => {
      if (!isMounted) return;
      if (stored) {
        setPreferenceState(stored);
      }
      setHasLoaded(true);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const resolvedThemeId = useMemo<ThemeId>(() => {
    if (preference === 'system') {
      return systemScheme === 'dark' ? DEFAULT_DARK_THEME_ID : DEFAULT_THEME_ID;
    }
    return preference;
  }, [preference, systemScheme]);

  const theme = useMemo(() => THEME_BY_ID[resolvedThemeId], [resolvedThemeId]);
  const colors = useMemo(() => createThemeColors(theme.variables), [theme]);
  const isDark = theme.mode === 'dark';

  useEffect(() => {
    if (!hasLoaded) return;
    storePreference(preference);
  }, [hasLoaded, preference]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const root = typeof document !== 'undefined' ? document.documentElement : null;
    if (!root) return;
    Object.entries(theme.variables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      setPreference: setPreferenceState,
      theme,
      resolvedThemeId,
      isDark,
      colors,
      alpha: (token, opacity) => toRgba(theme.variables[token], opacity),
      themes: THEMES,
    }),
    [preference, theme, resolvedThemeId, isDark, colors]
  );

  return (
    <ThemeContext.Provider value={value}>
      <View style={vars(theme.variables)} className="flex-1">
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within AppThemeProvider');
  }
  return context;
}
