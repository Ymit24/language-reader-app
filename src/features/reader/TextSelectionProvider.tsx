import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import { LayoutRectangle, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export interface TokenType {
  _id?: string;
  index?: number;
  isWord: boolean;
  surface: string;
  normalized?: string;
}

export interface TokenBounds extends LayoutRectangle {
  tokenIndex: number;
  pageY: number; // Absolute Y position for hit testing
}

interface SelectionState {
  isSelecting: boolean;
  selectionStartIndex: number | null;
  selectionEndIndex: number | null;
  isComplete: boolean;
}

interface TextSelectionContextValue {
  // State
  selectionState: SelectionState;
  selectedTokenIndices: Set<number>;

  // Token bounds management
  registerTokenBounds: (tokenIndex: number, bounds: TokenBounds) => void;
  unregisterTokenBounds: (tokenIndex: number) => void;
  getTokenAtPosition: (x: number, y: number) => number | null;

  // Selection actions
  startSelection: (tokenIndex: number) => void;
  updateSelection: (tokenIndex: number) => void;
  completeSelection: () => void;
  clearSelection: () => void;
}

const TextSelectionContext = createContext<TextSelectionContextValue | null>(null);

export function useTextSelection() {
  const context = useContext(TextSelectionContext);
  if (!context) {
    throw new Error('useTextSelection must be used within a TextSelectionProvider');
  }
  return context;
}

interface TextSelectionProviderProps {
  children: React.ReactNode;
  onSelectionComplete?: (tokens: TokenType[], bounds: LayoutRectangle | null) => void;
  tokens: TokenType[];
}

export function TextSelectionProvider({
  children,
  onSelectionComplete,
  tokens,
}: TextSelectionProviderProps) {
  const initialSelectionState = useMemo<SelectionState>(
    () => ({
      isSelecting: false,
      selectionStartIndex: null,
      selectionEndIndex: null,
      isComplete: false,
    }),
    []
  );
  const [selectionState, setSelectionState] = useState<SelectionState>(initialSelectionState);
  const selectionStateRef = useRef(selectionState);

  // Use a ref for token bounds to avoid re-renders when registering
  const tokenBoundsRef = useRef<Map<number, TokenBounds>>(new Map());
  const lastHapticIndex = useRef<number | null>(null);

  useEffect(() => {
    selectionStateRef.current = selectionState;
  }, [selectionState]);

  useEffect(() => {
    tokenBoundsRef.current.clear();
    lastHapticIndex.current = null;
    setSelectionState(initialSelectionState);
  }, [tokens, initialSelectionState]);

  // Compute selected token indices
  const selectedTokenIndices = useMemo(() => {
    const indices = new Set<number>();
    const { selectionStartIndex, selectionEndIndex, isSelecting, isComplete } = selectionState;

    if ((isSelecting || isComplete) && selectionStartIndex !== null && selectionEndIndex !== null) {
      const start = Math.min(selectionStartIndex, selectionEndIndex);
      const end = Math.max(selectionStartIndex, selectionEndIndex);

      for (let i = start; i <= end; i++) {
        // Only include word tokens in the visual selection
        if (tokens[i]?.isWord) {
          indices.add(i);
        }
      }
    }

    return indices;
  }, [selectionState, tokens]);

  const registerTokenBounds = useCallback((tokenIndex: number, bounds: TokenBounds) => {
    tokenBoundsRef.current.set(tokenIndex, bounds);
  }, []);

  const unregisterTokenBounds = useCallback((tokenIndex: number) => {
    tokenBoundsRef.current.delete(tokenIndex);
  }, []);

  const getTokenAtPosition = useCallback((x: number, y: number): number | null => {
    // Find the token that contains this position
    for (const [tokenIndex, bounds] of tokenBoundsRef.current.entries()) {
      if (
        x >= bounds.x &&
        x <= bounds.x + bounds.width &&
        y >= bounds.pageY &&
        y <= bounds.pageY + bounds.height
      ) {
        return tokenIndex;
      }
    }
    return null;
  }, []);

  const triggerHaptic = useCallback((type: 'start' | 'update' | 'complete') => {
    if (Platform.OS === 'web') return;

    switch (type) {
      case 'start':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'update':
        Haptics.selectionAsync();
        break;
      case 'complete':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
    }
  }, []);

  const startSelection = useCallback((tokenIndex: number) => {
    triggerHaptic('start');
    lastHapticIndex.current = tokenIndex;
    setSelectionState({
      isSelecting: true,
      selectionStartIndex: tokenIndex,
      selectionEndIndex: tokenIndex,
      isComplete: false,
    });
  }, [triggerHaptic]);

  const updateSelection = useCallback((tokenIndex: number) => {
    setSelectionState((prev) => {
      if (!prev.isSelecting || prev.selectionStartIndex === null) {
        return prev;
      }

      // Only trigger haptic if we moved to a new token
      if (lastHapticIndex.current !== tokenIndex) {
        triggerHaptic('update');
        lastHapticIndex.current = tokenIndex;
      }

      return {
        ...prev,
        selectionEndIndex: tokenIndex,
      };
    });
  }, [triggerHaptic]);

  const computeSelectionBounds = useCallback(
    (start: number, end: number): LayoutRectangle | null => {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (let i = start; i <= end; i++) {
        const bounds = tokenBoundsRef.current.get(i);
        if (bounds && tokens[i]?.isWord) {
          minX = Math.min(minX, bounds.x);
          minY = Math.min(minY, bounds.pageY);
          maxX = Math.max(maxX, bounds.x + bounds.width);
          maxY = Math.max(maxY, bounds.pageY + bounds.height);
        }
      }

      if (minX === Infinity) {
        return null;
      }

      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      };
    },
    [tokens]
  );

  const completeSelection = useCallback(() => {
    const current = selectionStateRef.current;
    if (!current.isSelecting || current.selectionStartIndex === null) {
      return;
    }

    const start = Math.min(current.selectionStartIndex, current.selectionEndIndex ?? current.selectionStartIndex);
    const end = Math.max(current.selectionStartIndex, current.selectionEndIndex ?? current.selectionStartIndex);

    const selectedTokens = tokens.slice(start, end + 1);
    const hasWordToken = selectedTokens.some((t) => t.isWord);

    if (!hasWordToken) {
      selectionStateRef.current = initialSelectionState;
      setSelectionState(initialSelectionState);
      lastHapticIndex.current = null;
      return;
    }

    const bounds = computeSelectionBounds(start, end);
    const nextState: SelectionState = {
      ...current,
      isSelecting: false,
      isComplete: true,
      selectionEndIndex: current.selectionEndIndex ?? current.selectionStartIndex,
    };

    selectionStateRef.current = nextState;
    setSelectionState(nextState);
    triggerHaptic('complete');
    lastHapticIndex.current = null;
    onSelectionComplete?.(selectedTokens, bounds);
  }, [computeSelectionBounds, initialSelectionState, onSelectionComplete, tokens, triggerHaptic]);

  const clearSelection = useCallback(() => {
    lastHapticIndex.current = null;
    selectionStateRef.current = initialSelectionState;
    setSelectionState(initialSelectionState);
  }, [initialSelectionState]);

  const value = useMemo<TextSelectionContextValue>(
    () => ({
      selectionState,
      selectedTokenIndices,
      registerTokenBounds,
      unregisterTokenBounds,
      getTokenAtPosition,
      startSelection,
      updateSelection,
      completeSelection,
      clearSelection,
    }),
    [
      selectionState,
      selectedTokenIndices,
      registerTokenBounds,
      unregisterTokenBounds,
      getTokenAtPosition,
      startSelection,
      updateSelection,
      completeSelection,
      clearSelection,
    ]
  );

  return (
    <TextSelectionContext.Provider value={value}>
      {children}
    </TextSelectionContext.Provider>
  );
}
