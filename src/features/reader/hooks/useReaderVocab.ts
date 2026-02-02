import { useQuery } from 'convex/react';
import { useMemo, useState } from 'react';
import { api } from '../../../../convex/_generated/api';

interface UseReaderVocabOptions {
  language: string;
}

export function useReaderVocab({ language }: UseReaderVocabOptions) {
  const vocabData = useQuery(
    api.vocab.getVocabProfile,
    language ? { language: language as 'de' | 'fr' | 'ja' } : 'skip'
  );
  const isVocabLoading = vocabData === undefined;

  const [localStatusOverrides, setLocalStatusOverrides] = useState<
    Record<string, number>
  >({});

  const vocabMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (vocabData) {
      for (const v of vocabData) {
        map[v.term] = v.status;
      }
    }
    for (const [term, status] of Object.entries(localStatusOverrides)) {
      map[term] = status;
    }
    return map;
  }, [vocabData, localStatusOverrides]);

  return {
    vocabMap,
    isVocabLoading,
    localStatusOverrides,
    setLocalStatusOverrides,
  };
}
