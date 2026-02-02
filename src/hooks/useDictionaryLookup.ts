import { useState, useEffect, useRef, useMemo } from 'react';
import { useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';

export interface DictionaryEntry {
  partOfSpeech: string;
  phonetic?: string;
  tags?: string[];
  definitions: {
    definition: string;
    examples?: string[];
    synonyms?: string[];
    antonyms?: string[];
  }[];
}

export interface LookupResult {
  success: boolean;
  entries: DictionaryEntry[];
  lemma?: string;
  lemmaEntries: DictionaryEntry[];
  error?: string;
}

interface UseDictionaryLookupOptions {
  term: string;
  language: 'de' | 'fr' | 'ja';
  autoLookup?: boolean;
}

export function useDictionaryLookup({
  term,
  language,
  autoLookup = false,
}: UseDictionaryLookupOptions) {
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [hasLookupError, setHasLookupError] = useState(false);
  const cacheRef = useRef(new Map<string, LookupResult>());
  const lookupAction = useAction(api.dictionaryActions.lookupDefinition);

  const lookupKey = useMemo(
    () => `${language}:${term.toLowerCase()}`,
    [language, term]
  );

  const performLookup = async () => {
    if (!term || isLookingUp) return;

    // Check cache first
    const cached = cacheRef.current.get(lookupKey);
    if (cached) {
      setLookupResult(cached);
      setHasLookupError(!cached.success);
      return;
    }

    setIsLookingUp(true);
    setHasLookupError(false);

    try {
      const result = await lookupAction({
        term,
        language,
      });

      cacheRef.current.set(lookupKey, result);
      setLookupResult(result);
      setHasLookupError(!result.success);
    } catch (error) {
      console.error('Dictionary lookup failed:', error);
      const errorResult: LookupResult = {
        success: false,
        entries: [],
        lemmaEntries: [],
        error: 'Lookup failed',
      };
      setLookupResult(errorResult);
      setHasLookupError(true);
    } finally {
      setIsLookingUp(false);
    }
  };

  // Auto-lookup on mount if requested
  useEffect(() => {
    if (autoLookup && term) {
      performLookup();
    }
  }, [lookupKey, autoLookup]);

  const clearLookup = () => {
    setLookupResult(null);
    setHasLookupError(false);
  };

  return {
    lookupResult,
    isLookingUp,
    hasLookupError,
    performLookup,
    clearLookup,
  };
}
