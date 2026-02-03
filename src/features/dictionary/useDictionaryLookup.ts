import { useAction } from 'convex/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/convex/_generated/api';
import type { LanguageCode } from '@/src/lib/languages';
import type { LookupResult, DictionaryEntry } from './types';

interface UseDictionaryLookupArgs {
  language: LanguageCode;
  term: string;
  enabled?: boolean;
}

interface DictionaryLookupState {
  entries: DictionaryEntry[];
  lemma?: string;
  lemmaEntries: DictionaryEntry[];
  isLoading: boolean;
  hasError: boolean;
}

const cache = new Map<string, LookupResult>();

export function useDictionaryLookup({
  language,
  term,
  enabled = true,
}: UseDictionaryLookupArgs) {
  const lookupAction = useAction(api.dictionaryActions.lookupDefinition);
  const lookupKey = useMemo(
    () => `${language}:${term.toLowerCase()}`,
    [language, term]
  );
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState<DictionaryLookupState>({
    entries: [],
    lemma: undefined,
    lemmaEntries: [],
    isLoading: false,
    hasError: false,
  });

  useEffect(() => {
    if (!enabled || !term) {
      setState({
        entries: [],
        lemma: undefined,
        lemmaEntries: [],
        isLoading: false,
        hasError: false,
      });
      return;
    }

    const cached = cache.get(lookupKey);
    if (cached) {
      setState({
        entries: cached.entries,
        lemma: cached.lemma,
        lemmaEntries: cached.lemmaEntries,
        isLoading: false,
        hasError: !cached.success,
      });
      return;
    }

    setState({
      entries: [],
      lemma: undefined,
      lemmaEntries: [],
      isLoading: true,
      hasError: false,
    });
  }, [enabled, lookupKey, term]);

  useEffect(() => {
    if (!enabled || !term) return;

    const cached = cache.get(lookupKey);
    if (cached) {
      setState({
        entries: cached.entries,
        lemma: cached.lemma,
        lemmaEntries: cached.lemmaEntries,
        isLoading: false,
        hasError: !cached.success,
      });
      return;
    }

    let cancelled = false;

    const fetchDefinition = async () => {
      setState((prev) => ({ ...prev, isLoading: true, hasError: false }));
      try {
        const result = (await lookupAction({ language, term })) as LookupResult;
        cache.set(lookupKey, result);
        if (cancelled) return;
        setState({
          entries: result.entries,
          lemma: result.lemma,
          lemmaEntries: result.lemmaEntries,
          isLoading: false,
          hasError: !result.success,
        });
      } catch (_error) {
        if (cancelled) return;
        setState({
          entries: [],
          lemma: undefined,
          lemmaEntries: [],
          isLoading: false,
          hasError: true,
        });
      }
    };

    fetchDefinition();

    return () => {
      cancelled = true;
    };
  }, [enabled, language, lookupAction, lookupKey, nonce, term]);

  const retry = useCallback(() => {
    cache.delete(lookupKey);
    setNonce((prev) => prev + 1);
  }, [lookupKey]);

  const hasResults = state.entries.length > 0 || state.lemmaEntries.length > 0;

  return {
    ...state,
    hasResults,
    retry,
  };
}
