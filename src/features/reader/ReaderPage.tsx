import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { LayoutChangeEvent, LayoutRectangle, ScrollView, Text, View } from 'react-native';
import { Gesture, GestureDetector, GestureType } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';
import {
  TextSelectionProvider,
  TokenBounds,
  TokenType,
  useTextSelection,
} from './TextSelectionProvider';
import { Token, TokenStatus } from './Token';

interface ReaderPageProps {
  tokens: TokenType[];
  vocabMap: Record<string, number>;
  onTokenPress: (token: TokenType) => void;
  selectedTokenId: string | null;
  selectedNormalized: string | null;
  onSelectionGestureRef?: (ref: React.RefObject<GestureType | undefined>) => void;
  isActivePage?: boolean;
  onPhraseSelectionComplete?: (tokens: TokenType[], bounds: LayoutRectangle | null) => void;
  onClearSelectionReady?: (clearSelection: () => void) => void;
}

// Minimum duration for long press in ms
const LONG_PRESS_DURATION = 400;

export function ReaderPage({
  tokens,
  vocabMap,
  onTokenPress,
  selectedTokenId,
  selectedNormalized,
  onSelectionGestureRef,
  isActivePage,
  onPhraseSelectionComplete,
  onClearSelectionReady,
}: ReaderPageProps) {
  return (
    <TextSelectionProvider tokens={tokens} onSelectionComplete={onPhraseSelectionComplete}>
      <ReaderPageContent
        tokens={tokens}
        vocabMap={vocabMap}
        onTokenPress={onTokenPress}
        selectedTokenId={selectedTokenId}
        selectedNormalized={selectedNormalized}
        onSelectionGestureRef={onSelectionGestureRef}
        isActivePage={isActivePage}
        onClearSelectionReady={onClearSelectionReady}
      />
    </TextSelectionProvider>
  );
}

interface ReaderPageContentProps {
  tokens: TokenType[];
  vocabMap: Record<string, number>;
  onTokenPress: (token: TokenType) => void;
  selectedTokenId: string | null;
  selectedNormalized: string | null;
  onSelectionGestureRef?: (ref: React.RefObject<GestureType | undefined>) => void;
  isActivePage?: boolean;
  onClearSelectionReady?: (clearSelection: () => void) => void;
}

function ReaderPageContent({
  tokens,
  vocabMap,
  onTokenPress,
  selectedTokenId,
  selectedNormalized,
  onSelectionGestureRef,
  isActivePage,
  onClearSelectionReady,
}: ReaderPageContentProps) {
  const {
    selectionState,
    selectedTokenIndices,
    registerTokenBounds,
    startSelection,
    updateSelection,
    completeSelection,
    clearSelection,
  } = useTextSelection();

  // Track token positions using refs (no state to avoid re-renders)
  // Key: page-local index (0 to tokens.length-1)
  const tokenPositionsRef = useRef<Map<number, TokenBounds>>(new Map());
  const tokenLayoutsRef = useRef<
    Map<number, { x: number; y: number; width: number; height: number; paraIndex: number }>
  >(new Map());
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollOffsetRef = useRef(0);
  const rootViewRef = useRef<View>(null);
  const contentViewRef = useRef<View>(null);
  const contentInsetRef = useRef({ x: 0, y: 0 });
  const rootWindowRef = useRef({ x: 0, y: 0 });
  const paragraphOffsetsRef = useRef<Map<number, { x: number; y: number }>>(new Map());

  useEffect(() => {
    if (isActivePage) {
      onClearSelectionReady?.(clearSelection);
    }
  }, [clearSelection, isActivePage, onClearSelectionReady]);

  const computeAndRegisterBounds = useCallback(
    (tokenIndex: number) => {
      const layout = tokenLayoutsRef.current.get(tokenIndex);
      if (!layout) return;

      const { x: insetX, y: insetY } = contentInsetRef.current;
      const { x: rootX, y: rootY } = rootWindowRef.current;
      const scrollOffset = scrollOffsetRef.current;
      const paraOffset = paragraphOffsetsRef.current.get(layout.paraIndex) || { x: 0, y: 0 };

      const contentX = paraOffset.x + layout.x;
      const contentY = paraOffset.y + layout.y;

      const bounds: TokenBounds = {
        tokenIndex,
        x: contentX,
        y: contentY,
        width: layout.width,
        height: layout.height,
        pageY: contentY,
      };

      tokenPositionsRef.current.set(tokenIndex, bounds);
      registerTokenBounds(tokenIndex, {
        ...bounds,
        x: rootX + insetX + contentX,
        y: rootY + insetY + contentY - scrollOffset,
        pageY: rootY + insetY + contentY - scrollOffset,
      });
    },
    [registerTokenBounds]
  );

  const refreshRegisteredBounds = useCallback(() => {
    const { x: insetX, y: insetY } = contentInsetRef.current;
    const { x: rootX, y: rootY } = rootWindowRef.current;
    const scrollOffset = scrollOffsetRef.current;

    for (const [tokenIndex, bounds] of tokenPositionsRef.current.entries()) {
      registerTokenBounds(tokenIndex, {
        ...bounds,
        x: rootX + insetX + bounds.x,
        y: rootY + insetY + bounds.y - scrollOffset,
        pageY: rootY + insetY + bounds.y - scrollOffset,
      });
    }
  }, [registerTokenBounds]);

  const updateContentInset = useCallback(() => {
    const root = rootViewRef.current;
    const content = contentViewRef.current;

    if (!root || !content) return;

    root.measureInWindow((rootX, rootY) => {
      rootWindowRef.current = { x: rootX, y: rootY };
      content.measureInWindow((contentX, contentY) => {
        contentInsetRef.current = {
          x: contentX - rootX,
          y: contentY - rootY,
        };
        refreshRegisteredBounds();
      });
    });
  }, [refreshRegisteredBounds]);

  // Handle token layout updates
  // tokenIndex here is the PAGE-LOCAL index (0 to tokens.length-1)
  const handleTokenLayout = useCallback(
    (tokenIndex: number, paraIndex: number, event: LayoutChangeEvent) => {
      const { x, y, width, height } = event.nativeEvent.layout;
      tokenLayoutsRef.current.set(tokenIndex, { x, y, width, height, paraIndex });
      computeAndRegisterBounds(tokenIndex);
    },
    [computeAndRegisterBounds]
  );

  // Find token at position relative to gesture view
  // x, y are relative to the GestureDetector view (which wraps ScrollView)
  const findTokenAtPosition = useCallback(
    (x: number, y: number): number | null => {
      const scrollOffset = scrollOffsetRef.current;
      const { x: insetX, y: insetY } = contentInsetRef.current;

      // Convert gesture position to content position (accounting for scroll)
      const contentY = y - insetY + scrollOffset;
      const contentX = x - insetX;

      // Find matching token using page-local indices
      for (const [pageLocalIndex, bounds] of tokenPositionsRef.current.entries()) {
        // Verify this is a valid index and is a word token
        if (pageLocalIndex < 0 || pageLocalIndex >= tokens.length) {
          continue;
        }
        if (!tokens[pageLocalIndex]?.isWord) {
          continue;
        }

        // Expand hit area slightly for easier selection
        const hitPadding = 8;
        if (
          contentX >= bounds.x - hitPadding &&
          contentX <= bounds.x + bounds.width + hitPadding &&
          contentY >= bounds.y - hitPadding &&
          contentY <= bounds.y + bounds.height + hitPadding
        ) {
          return pageLocalIndex;
        }
      }

      // If no exact match, find the closest word token on the same line
      let closestToken: number | null = null;
      let closestDistance = Infinity;

      for (const [pageLocalIndex, bounds] of tokenPositionsRef.current.entries()) {
        if (pageLocalIndex < 0 || pageLocalIndex >= tokens.length) continue;
        if (!tokens[pageLocalIndex]?.isWord) continue;

        // Check if on the same horizontal line (with tolerance)
        const lineHeight = bounds.height;
        const lineTolerance = lineHeight * 0.6;

        if (
          contentY >= bounds.y - lineTolerance &&
          contentY <= bounds.y + bounds.height + lineTolerance
        ) {
          const centerX = bounds.x + bounds.width / 2;
          const distance = Math.abs(contentX - centerX);

          if (distance < closestDistance) {
            closestDistance = distance;
            closestToken = pageLocalIndex;
          }
        }
      }

      return closestToken;
    },
    [tokens]
  );

  // Shared values to coordinate gesture state on the UI thread
  const touchStartTime = useSharedValue(0);
  const isLongPressTriggered = useSharedValue(false);
  const startPosition = useSharedValue({ x: 0, y: 0 });

  // Handle long press start - wrapped for runOnJS
  const handleLongPressStart = useCallback(
    (x: number, y: number) => {
      const tokenIndex = findTokenAtPosition(x, y);
      if (tokenIndex !== null && tokens[tokenIndex]?.isWord) {
        startSelection(tokenIndex);
      }
    },
    [findTokenAtPosition, startSelection, tokens]
  );

  // Handle drag update - wrapped for runOnJS
  const handleDragUpdate = useCallback(
    (x: number, y: number) => {
      const tokenIndex = findTokenAtPosition(x, y);
      if (tokenIndex !== null) {
        updateSelection(tokenIndex);
      }
    },
    [findTokenAtPosition, updateSelection]
  );

  // Handle drag end - wrapped for runOnJS
  const handleDragEnd = useCallback(() => {
    completeSelection();
  }, [completeSelection]);

  const selectionGestureRef = useRef<GestureType | undefined>(undefined);

  const longPressGesture = Gesture.LongPress()
  .minDuration(400)
  .onStart((e)=> {
    isLongPressTriggered.value = true;
    runOnJS(handleLongPressStart)(e.x, e.y);
  });

  const panGesture = Gesture.Pan()
    .withRef(selectionGestureRef)
    .activateAfterLongPress(400)
    .minDistance(0)
    .manualActivation(true)
    .onTouchesMove((_e, manager) => {
      if (isLongPressTriggered.value) {
        manager.activate();
      }
    })
    .onUpdate((e) => {
      if (isLongPressTriggered.value) {
        console.log('Pan onUpdate', e.x, e.y);
        runOnJS(handleDragUpdate)(e.x, e.y);
      }
    })
    .onEnd(() => {
      if (isLongPressTriggered.value) {
        console.log('Pan onEnd');
        runOnJS(handleDragEnd)();
      }
    })
    .onFinalize(() => {
      isLongPressTriggered.value = false;
    });;

  const selectionGesture = Gesture
  .Simultaneous(longPressGesture, panGesture);
  // Pass ref up to parent once
  useEffect(() => {
    onSelectionGestureRef?.(selectionGestureRef);
  }, [onSelectionGestureRef]);

  const composedGesture = selectionGesture;

  // Handle scroll offset tracking
  const handleScroll = useCallback((event: any) => {
    scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
    refreshRegisteredBounds();
  }, [refreshRegisteredBounds]);

  // Split tokens into paragraphs, tracking page-local indices
  // IMPORTANT: Each token must appear exactly once with a unique pageLocalIndex
  // to ensure correct position tracking for phrase selection
  const paragraphs = useMemo(() => {
    const paras: { token: TokenType; pageLocalIndex: number }[][] = [[]];

    tokens.forEach((token, pageLocalIndex) => {
      // Add the token to the current paragraph (keep it whole)
      paras[paras.length - 1].push({ token, pageLocalIndex });

      // If this token contains a paragraph break, start a new paragraph
      // for subsequent tokens
      if (!token.isWord && token.surface.includes('\n\n')) {
        paras.push([]);
      }
    });

    // Filter out any empty paragraphs (e.g., if the last token was a paragraph break)
    return paras.filter((para) => para.length > 0);
  }, [tokens]);

  const isSelectingOrComplete = selectionState.isSelecting || selectionState.isComplete;

  return (
    <GestureDetector gesture={composedGesture}>
      <View
        ref={rootViewRef}
        style={{ flex: 1 }}
        onLayout={() => {
          updateContentInset();
        }}
      >
        {false &&
          <View className="p-4">
            <View
              className="bg-white/5 border border-gray-300 rounded-md p-3"
              style={{ maxHeight: 384 }}
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text className="text-sm font-semibold mb-2">Gesture / Selection Debug</Text>

                <Text className="text-xs mb-1">
                  selectionState: {JSON.stringify({
                    isSelecting: selectionState.isSelecting,
                    isComplete: selectionState.isComplete,
                    startIndex: selectionState.selectionStartIndex,
                    endIndex: selectionState.selectionEndIndex,
                  })}
                </Text>

                <Text className="text-xs mb-1">
                  isSelectingOrComplete: {String(isSelectingOrComplete)}
                </Text>

                <Text className="text-xs mb-1">
                  selectedTokenIndices (size): {selectedTokenIndices.size}
                </Text>

                <Text className="text-xs mb-1">
                  selectedTokenIndices (first 10): {JSON.stringify(
                    [...selectedTokenIndices].slice(0, 10)
                  )}
                </Text>

                <Text className="text-xs mb-1">
                  tokenPositions: {tokenPositionsRef.current.size} entries
                </Text>

                <Text className="text-xs mb-1">
                  tokenLayouts: {tokenLayoutsRef.current.size} entries
                </Text>

                <Text className="text-xs mb-1">paragraphs: {paragraphs.length}</Text>

                <Text className="text-xs mb-1">
                  scrollOffset: {Number(scrollOffsetRef.current).toFixed(1)}
                </Text>

                <Text className="text-xs mb-1">
                  startPosition: {JSON.stringify(startPosition.value)}
                </Text>

                <Text className="text-xs mb-1">
                  touchStartTime: {String(touchStartTime.value)}
                </Text>

                <Text className="text-xs mb-1">
                  isLongPressTriggered: {String(isLongPressTriggered.value)}
                </Text>

                <Text className="text-xs mb-1">selectedTokenId: {String(selectedTokenId)}</Text>

                <Text className="text-xs mb-1">
                  selectedNormalized: {String(selectedNormalized)}
                </Text>
              </ScrollView>
            </View>
          </View>
        }
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-6 md:px-12 lg:px-20 pt-10"
          contentContainerStyle={{ paddingBottom: 96 }}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <View
            ref={contentViewRef}
            className="flex-col items-start justify-start w-full max-w-3xl self-center"
            onLayout={() => {
              updateContentInset();
            }}
          >
            {paragraphs.map((paraTokens, paraIndex) => (
              <View
                key={`para-${paraIndex}`}
                className="mb-8 flex-row flex-wrap"
                onLayout={(event) => {
                  const { x, y } = event.nativeEvent.layout;
                  paragraphOffsetsRef.current.set(paraIndex, { x, y });

                  for (const [tokenIndex, layout] of tokenLayoutsRef.current.entries()) {
                    if (layout.paraIndex === paraIndex) {
                      computeAndRegisterBounds(tokenIndex);
                    }
                  }
                }}
              >
                {paraTokens.map(({ token, pageLocalIndex }) => {
                  const isWord: boolean = token.isWord;
                  let status: TokenStatus = 'new';
                  let learningLevel: number | undefined;

                  if (isWord && token.normalized) {
                    const vocabStatus = vocabMap[token.normalized];
                    if (vocabStatus !== undefined) {
                      if (vocabStatus === 4) {
                        status = 'known';
                      } else if (vocabStatus === 3) {
                        status = 'familiar';
                        learningLevel = vocabStatus;
                      } else if (vocabStatus >= 1 && vocabStatus <= 2) {
                        status = 'learning';
                        learningLevel = vocabStatus;
                      } else {
                        status = 'new';
                      }
                    }
                  }

                  const key = token._id || `token-${pageLocalIndex}`;
                  const isSelected = selectedTokenId === key;
                  const isWordSelected = Boolean(
                    isWord && token.normalized && token.normalized === selectedNormalized
                  );
                  // Use page-local index for selection check
                  const isInPhraseSelection = isWord && selectedTokenIndices.has(pageLocalIndex);

                  return (
                    <Token
                      key={key}
                      surface={token.surface}
                      isWord={isWord}
                      status={status}
                      learningLevel={learningLevel}
                      isSelected={isSelected}
                      normalized={token.normalized}
                      isWordSelected={isWordSelected}
                      isInPhraseSelection={isSelectingOrComplete ? isInPhraseSelection : undefined}
                      tokenIndex={pageLocalIndex}
                      onLayout={(tokenIndex, event) => {
                        handleTokenLayout(tokenIndex, paraIndex, event);
                      }}
                      onPress={
                        isWord && !selectionState.isSelecting
                          ? () => onTokenPress(token)
                          : undefined
                      }
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </GestureDetector>
  );
}
