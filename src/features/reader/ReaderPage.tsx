import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { LayoutChangeEvent, LayoutRectangle, ScrollView, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
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
  isActivePage?: boolean;
  onClearSelectionReady?: (clearSelection: () => void) => void;
}

function ReaderPageContent({
  tokens,
  vocabMap,
  onTokenPress,
  selectedTokenId,
  selectedNormalized,
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
        if (pageLocalIndex < 0 || pageLocalIndex >= tokens.length) continue;
        if (!tokens[pageLocalIndex]?.isWord) continue;

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

  // Manual gesture for full control over long press + drag behavior
  const selectionGesture = Gesture.Manual()
    .onTouchesDown((event, stateManager) => {
      // Record touch start time and position
      touchStartTime.value = Date.now();
      isLongPressTriggered.value = false;
      if (event.changedTouches.length > 0) {
        const touch = event.changedTouches[0];
        startPosition.value = { x: touch.x, y: touch.y };
      }
      stateManager.begin();
    })
    .onTouchesMove((event, stateManager) => {
      if (event.numberOfTouches !== 1) {
        // Multi-touch - fail the gesture to allow other gestures
        if (!isLongPressTriggered.value) {
          stateManager.fail();
        }
        return;
      }

      const touch = event.changedTouches[0] || event.allTouches[0];
      if (!touch) return;

      const elapsed = Date.now() - touchStartTime.value;
      const dx = touch.x - startPosition.value.x;
      const dy = touch.y - startPosition.value.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Check if long press duration has been met
      if (!isLongPressTriggered.value && elapsed >= LONG_PRESS_DURATION) {
        // Long press activated - check we haven't moved too far
        if (distance <= 15) {
          isLongPressTriggered.value = true;
          stateManager.activate();
          runOnJS(handleLongPressStart)(startPosition.value.x, startPosition.value.y);
        } else {
          // Moved too much before long press completed - fail
          stateManager.fail();
        }
      } else if (isLongPressTriggered.value) {
        // Already in selection mode - update selection
        runOnJS(handleDragUpdate)(touch.x, touch.y);
      } else if (distance > 15) {
        // Moved too much before long press - fail to allow scrolling/swiping
        stateManager.fail();
      }
    })
    .onTouchesUp((event, stateManager) => {
      const elapsed = Date.now() - touchStartTime.value;
      
      if (isLongPressTriggered.value) {
        // Was in selection mode - complete it
        runOnJS(handleDragEnd)();
        stateManager.end();
      } else if (elapsed >= LONG_PRESS_DURATION && event.numberOfTouches === 0) {
        // Long press duration met on release without movement - trigger selection at start position
        // This handles the case where user holds still without any movement events
        const touch = event.changedTouches[0];
        if (touch) {
          const dx = touch.x - startPosition.value.x;
          const dy = touch.y - startPosition.value.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance <= 15) {
            runOnJS(handleLongPressStart)(startPosition.value.x, startPosition.value.y);
            runOnJS(handleDragEnd)();
            stateManager.end();
            isLongPressTriggered.value = false;
            return;
          }
        }
        stateManager.fail();
      } else {
        // Long press never triggered
        stateManager.fail();
      }
      isLongPressTriggered.value = false;
    })
    .onTouchesCancelled((_, stateManager) => {
      if (isLongPressTriggered.value) {
        runOnJS(handleDragEnd)();
      }
      isLongPressTriggered.value = false;
      stateManager.end();
    });

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
              <Text
                key={`para-${paraIndex}`}
                className="mb-8"
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
              </Text>
            ))}
          </View>
        </ScrollView>
      </View>
    </GestureDetector>
  );
}
