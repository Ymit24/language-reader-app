import { useState, useCallback } from 'react';

export interface ReaderToken {
  _id?: string;
  index?: number;
  isWord: boolean;
  surface: string;
  normalized?: string;
}

export function useReaderInspector() {
  const [selectedToken, setSelectedToken] = useState<ReaderToken | null>(null);
  const [selectedNormalized, setSelectedNormalized] = useState<string | null>(
    null
  );
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  const openInspector = useCallback((token: ReaderToken) => {
    setSelectedToken(token);
    setSelectedNormalized(token.normalized || null);
    setIsInspectorOpen(true);
  }, []);

  const closeInspector = useCallback(() => {
    setIsInspectorOpen(false);
    setSelectedToken(null);
    setSelectedNormalized(null);
  }, []);

  return {
    selectedToken,
    selectedNormalized,
    isInspectorOpen,
    openInspector,
    closeInspector,
  };
}
