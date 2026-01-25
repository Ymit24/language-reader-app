import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
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

  // For popup positioning
  getSelectionBounds: () => LayoutRectangle | null;
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
  onSelectionComplete?: (tokens: TokenType[]) => void;
  tokens: TokenType[];
}

export function TextSelectionProvider({
  children,
  onSelectionComplete,
  tokens,
}: TextSelectionProviderProps) {
  const [selectionState, setSelectionState] = useState<SelectionState>({
    isSelecting: false,
    selectionStartIndex: null,
    selectionEndIndex: null,
    isComplete: false,
  });

  // Use a ref for token bounds to avoid re-renders when registering
  const tokenBoundsRef = useRef<Map<number, TokenBounds>>(new Map());
  const lastHapticIndex = useRef<number | null>(null);

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

  const completeSelection = useCallback(() => {
    setSelectionState((prev) => {
      if (!prev.isSelecting || prev.selectionStartIndex === null) {
        return prev;
      }

      triggerHaptic('complete');
      lastHapticIndex.current = null;

      // Get selected tokens for callback
      const start = Math.min(prev.selectionStartIndex, prev.selectionEndIndex ?? prev.selectionStartIndex);
      const end = Math.max(prev.selectionStartIndex, prev.selectionEndIndex ?? prev.selectionStartIndex);

      const selectedTokens = tokens.slice(start, end + 1);

      // Check if we have at least one word token selected
      const hasWordToken = selectedTokens.some((t) => t.isWord);

      if (!hasWordToken) {
        // No words selected, cancel selection
        return {
          isSelecting: false,
          selectionStartIndex: null,
          selectionEndIndex: null,
          isComplete: false,
        };
      }

      // Call the callback with selected tokens
      onSelectionComplete?.(selectedTokens);

      return {
        ...prev,
        isSelecting: false,
        isComplete: true,
      };
    });
  }, [tokens, onSelectionComplete, triggerHaptic]);

  const clearSelection = useCallback(() => {
    lastHapticIndex.current = null;
    setSelectionState({
      isSelecting: false,
      selectionStartIndex: null,
      selectionEndIndex: null,
      isComplete: false,
    });
  }, []);

  const getSelectionBounds = useCallback((): LayoutRectangle | null => {
    const { selectionStartIndex, selectionEndIndex } = selectionState;

    if (selectionStartIndex === null || selectionEndIndex === null) {
      return null;
    }

    const start = Math.min(selectionStartIndex, selectionEndIndex);
    const end = Math.max(selectionStartIndex, selectionEndIndex);

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
  }, [selectionState, tokens]);

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
      getSelectionBounds,
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
      getSelectionBounds,
    ]
  );

  return (
    <TextSelectionContext.Provider value={value}>
      {children}
    </TextSelectionContext.Provider>
  );
}
