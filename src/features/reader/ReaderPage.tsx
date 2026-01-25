import React, { useMemo, useCallback, useRef } from 'react';
import { View, ScrollView, Text, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { Token, TokenStatus } from './Token';
import { useTextSelection, TokenBounds, TokenType } from './TextSelectionProvider';

interface ReaderPageProps {
  tokens: TokenType[];
  vocabMap: Record<string, number>;
  onTokenPress: (token: TokenType) => void;
  selectedTokenId: string | null;
  selectedNormalized: string | null;
  isSelectionModeActive?: boolean;
}

// Minimum duration for long press in ms
const LONG_PRESS_DURATION = 400;

export function ReaderPage({
  tokens,
  vocabMap,
  onTokenPress,
  selectedTokenId,
  selectedNormalized,
}: ReaderPageProps) {
  const {
    selectionState,
    selectedTokenIndices,
    registerTokenBounds,
    startSelection,
    updateSelection,
    completeSelection,
  } = useTextSelection();

  // Track token positions using refs (no state to avoid re-renders)
  // Key: page-local index (0 to tokens.length-1)
  const tokenPositionsRef = useRef<Map<number, TokenBounds>>(new Map());
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollOffsetRef = useRef(0);

  // Handle token layout updates
  // tokenIndex here is the PAGE-LOCAL index (0 to tokens.length-1)
  const handleTokenLayout = useCallback(
    (tokenIndex: number, event: LayoutChangeEvent) => {
      const { x, y, width, height } = event.nativeEvent.layout;

      // Store position relative to the scroll content
      const bounds: TokenBounds = {
        tokenIndex,
        x,
        y,
        width,
        height,
        pageY: y,
      };

      tokenPositionsRef.current.set(tokenIndex, bounds);
      registerTokenBounds(tokenIndex, bounds);
    },
    [registerTokenBounds]
  );

  // Find token at position relative to gesture view
  // x, y are relative to the GestureDetector view (which wraps ScrollView)
  const findTokenAtPosition = useCallback(
    (x: number, y: number): number | null => {
      const scrollOffset = scrollOffsetRef.current;

      // Convert gesture position to content position (accounting for scroll)
      const contentY = y + scrollOffset;
      const contentX = x;

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
      if (!selectionState.isSelecting) return;

      const tokenIndex = findTokenAtPosition(x, y);
      if (tokenIndex !== null) {
        updateSelection(tokenIndex);
      }
    },
    [findTokenAtPosition, selectionState.isSelecting, updateSelection]
  );

  // Handle drag end - wrapped for runOnJS
  const handleDragEnd = useCallback(() => {
    if (selectionState.isSelecting) {
      completeSelection();
    }
  }, [completeSelection, selectionState.isSelecting]);

  // Compose gestures: Long press to start, then pan to extend
  const longPressGesture = Gesture.LongPress()
    .minDuration(LONG_PRESS_DURATION)
    .onStart((event) => {
      // Use event.x/y which are relative to the gesture view
      runOnJS(handleLongPressStart)(event.x, event.y);
    });

  const panGesture = Gesture.Pan()
    .manualActivation(true)
    .onTouchesMove((_, stateManager) => {
      // Only activate pan if we're in selection mode
      if (selectionState.isSelecting) {
        stateManager.activate();
      } else {
        stateManager.fail();
      }
    })
    .onUpdate((event) => {
      // Use event.x/y which are relative to the gesture view
      runOnJS(handleDragUpdate)(event.x, event.y);
    })
    .onEnd(() => {
      runOnJS(handleDragEnd)();
    })
    .onFinalize(() => {
      runOnJS(handleDragEnd)();
    });

  // Combine long press and pan gestures
  const composedGesture = Gesture.Simultaneous(longPressGesture, panGesture);

  // Handle scroll offset tracking
  const handleScroll = useCallback((event: any) => {
    scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  // Split tokens into paragraphs, tracking page-local indices
  const paragraphs = useMemo(() => {
    const paras: { token: TokenType; pageLocalIndex: number }[][] = [[]];

    tokens.forEach((token, pageLocalIndex) => {
      if (!token.isWord && token.surface.includes('\n\n')) {
        const parts = token.surface.split('\n\n');
        // First part goes to current paragraph
        paras[paras.length - 1].push({
          token: { ...token, surface: parts[0] },
          pageLocalIndex,
        });
        // Subsequent parts start new paragraphs
        for (let j = 1; j < parts.length; j++) {
          paras.push([
            {
              token: { ...token, surface: parts[j] },
              pageLocalIndex,
            },
          ]);
        }
      } else {
        paras[paras.length - 1].push({ token, pageLocalIndex });
      }
    });

    return paras;
  }, [tokens]);

  const isSelectingOrComplete = selectionState.isSelecting || selectionState.isComplete;

  return (
    <GestureDetector gesture={composedGesture}>
      <View style={{ flex: 1 }}>
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-6 md:px-12 lg:px-20 pt-10"
          contentContainerStyle={{ paddingBottom: 96 }}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <View className="flex-col items-start justify-start w-full max-w-3xl self-center">
            {paragraphs.map((paraTokens, paraIndex) => (
              <Text key={`para-${paraIndex}`} className="mb-8">
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
                      onLayout={handleTokenLayout}
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
