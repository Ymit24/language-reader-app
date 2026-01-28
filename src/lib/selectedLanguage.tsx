import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { LANGUAGES, type LanguageCode } from './languages';

type SelectedLanguageContextValue = {
  selectedLanguage: LanguageCode;
  setSelectedLanguage: (language: LanguageCode) => void;
  availableLanguages: LanguageCode[];
};

const SelectedLanguageContext = createContext<SelectedLanguageContextValue | null>(null);

const STORAGE_KEY = 'reader.language.selected';
const DEFAULT_LANGUAGE: LanguageCode = 'fr';

const isLanguage = (value: string | null): value is LanguageCode => {
  if (!value) return false;
  return LANGUAGES.includes(value as LanguageCode);
};

const getStoredLanguage = async (): Promise<LanguageCode | null> => {
  try {
    if (Platform.OS === 'web') {
      const stored = globalThis?.localStorage?.getItem(STORAGE_KEY) ?? null;
      return isLanguage(stored) ? stored : null;
    }
    const stored = await SecureStore.getItemAsync(STORAGE_KEY);
    return isLanguage(stored) ? stored : null;
  } catch {
    return null;
  }
};

const storeLanguage = async (value: LanguageCode) => {
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

export function SelectedLanguageProvider({ children }: { children: React.ReactNode }) {
  const [selectedLanguage, setSelectedLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getStoredLanguage().then((stored) => {
      if (!isMounted) return;
      if (stored) {
        setSelectedLanguageState(stored);
      }
      setHasLoaded(true);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    storeLanguage(selectedLanguage);
  }, [hasLoaded, selectedLanguage]);

  const value = useMemo<SelectedLanguageContextValue>(
    () => ({
      selectedLanguage,
      setSelectedLanguage: setSelectedLanguageState,
      availableLanguages: LANGUAGES,
    }),
    [selectedLanguage]
  );

  return (
    <SelectedLanguageContext.Provider value={value}>
      {children}
    </SelectedLanguageContext.Provider>
  );
}

export function useSelectedLanguage() {
  const context = useContext(SelectedLanguageContext);
  if (!context) {
    throw new Error('useSelectedLanguage must be used within SelectedLanguageProvider');
  }
  return context;
}
