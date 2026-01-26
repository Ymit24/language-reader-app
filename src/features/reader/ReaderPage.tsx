import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Token, TokenStatus } from './Token';
import { measureInWindow, Rect } from '../../lib/measureElement';

interface TokenType {
  _id?: string;
  index?: number;
  isWord: boolean;
  surface: string;
  normalized?: string;
}

interface ReaderPageProps {
  tokens: TokenType[];
  vocabMap: Record<string, number>;
  onTokenPress: (token: TokenType) => void;
  selectedTokenId: string | null;
  selectedNormalized: string | null;
  /** Called when page layout is ready (e.g., after carousel settles) */
  isActive?: boolean;
}

interface ParagraphToken extends TokenType {}

// Padding values matching the ScrollView styling
const SCROLL_PADDING_TOP = 40; // pt-10 = 2.5rem = 40px
const SCROLL_PADDING_HORIZONTAL = 24; // px-6 = 1.5rem = 24px (base)

const ReaderToken = React.memo(({
  token,
  vocabMap,
  selectedTokenId,
  selectedNormalized,
  onTokenPress,
  measureRef,
}: {
  token: TokenType;
  vocabMap: Record<string, number>;
  selectedTokenId: string | null;
  selectedNormalized: string | null;
  onTokenPress: (token: TokenType) => void;
  measureRef?: React.Ref<View>;
}) => {
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

  const key = token._id || `token-${token.index}`;
  const isSelected = selectedTokenId === key;
  const isWordSelected = Boolean(isWord && token.normalized && token.normalized === selectedNormalized);

  return (
    <Token
      measureRef={isWord ? measureRef : undefined}
      surface={token.surface}
      isWord={isWord}
      status={status}
      learningLevel={learningLevel}
      isSelected={isSelected}
      normalized={token.normalized}
      isWordSelected={isWordSelected}
      onPress={isWord ? (() => onTokenPress(token)) : undefined}
    />
  );
});

export function ReaderPage({
  tokens,
  vocabMap,
  onTokenPress,
  selectedTokenId,
  selectedNormalized,
  isActive = true,
}: ReaderPageProps) {
  const paragraphs = useMemo(() => {
    const paras: ParagraphToken[][] = [[]];

    tokens.forEach((token) => {
      if (!token.isWord && token.surface.includes('\n\n')) {
        const parts = token.surface.split('\n\n');
        paras[paras.length - 1].push({ ...token, surface: parts[0] });
        for (let j = 1; j < parts.length; j++) {
          paras.push([{ ...token, surface: parts[j] }]);
        }
      } else {
        paras[paras.length - 1].push(token);
      }
    });
    return paras;
  }, [tokens]);

  // Refs for measurement
  const contentContainerRef = useRef<View>(null);
  const tokenRefs = useRef<Map<string, View>>(new Map());
  const tokenLayoutsRef = useRef<Map<string, Rect>>(new Map());
  
  // Scroll tracking
  const scrollOffsetRef = useRef(0);
  
  // Debug overlay rects (content-relative coordinates)
  const [highlightRects, setHighlightRects] = useState<Rect[]>([]);
  
  // Layout ready flag
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  
  // Content dimensions for overlay sizing
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });
  
  // Offset of content container from gesture container (accounts for ScrollView padding)
  const contentOffsetRef = useRef({ x: 0, y: 0 });

  /**
   * Measures all token positions relative to the content container.
   * Also calculates the offset from gesture container to content container.
   * Should be called after layout is stable (e.g., after carousel animation).
   */
  const measureAllTokens = useCallback(async () => {
    const container = contentContainerRef.current;
    const gestureContainer = gestureContainerRef.current;
    if (!container || !gestureContainer) return;

    const [containerRect, gestureRect] = await Promise.all([
      measureInWindow(container),
      measureInWindow(gestureContainer),
    ]);
    
    if (!containerRect || !gestureRect) return;
    
    // Calculate offset from gesture container to content container
    contentOffsetRef.current = {
      x: containerRect.x - gestureRect.x,
      y: containerRect.y - gestureRect.y,
    };

    const newLayouts = new Map<string, Rect>();
    const rects: Rect[] = [];

    for (const [tokenId, tokenRef] of tokenRefs.current.entries()) {
      const tokenRect = await measureInWindow(tokenRef);
      if (tokenRect) {
        const relativeRect: Rect = {
          x: tokenRect.x - containerRect.x,
          y: tokenRect.y - containerRect.y,
          width: tokenRect.width,
          height: tokenRect.height,
        };
        newLayouts.set(tokenId, relativeRect);
        rects.push(relativeRect);
      }
    }

    tokenLayoutsRef.current = newLayouts;
    setHighlightRects(rects);
  }, []);

  // Measure tokens when layout is ready and page is active
  useEffect(() => {
    if (isLayoutReady && isActive) {
      // Small delay to ensure carousel animation is complete
      const timer = setTimeout(() => {
        measureAllTokens();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLayoutReady, isActive, measureAllTokens]);

  /**
   * Finds token at given content-relative coordinates
   */
  const findTokenAtPoint = useCallback((x: number, y: number): string | null => {
    for (const [tokenId, rect] of tokenLayoutsRef.current.entries()) {
      if (
        x >= rect.x &&
        x <= rect.x + rect.width &&
        y >= rect.y &&
        y <= rect.y + rect.height
      ) {
        return tokenId;
      }
    }
    return null;
  }, []);

  // Gesture detector ref for coordinate conversion
  const gestureContainerRef = useRef<View>(null);

  const longPressGesture = Gesture
    .LongPress()
    .minDuration(500);

  const panGesture = Gesture
    .Pan()
    .onUpdate((e) => {
      // Convert gesture coordinates to content-relative coordinates
      // Gesture coordinates (e.x, e.y) are relative to the GestureDetector container
      // We need to:
      // 1. Subtract the content container offset (accounts for ScrollView padding)
      // 2. Add scroll offset to get position within scrolled content
      const contentX = e.x - contentOffsetRef.current.x;
      const contentY = e.y - contentOffsetRef.current.y + scrollOffsetRef.current;

      // For debugging: show a rect at the touch point
      const touchRect: Rect = {
        x: contentX - 25,
        y: contentY - 25,
        width: 50,
        height: 50,
      };

      // Find which token is at this point
      const tokenId = findTokenAtPoint(contentX, contentY);
      if (tokenId) {
        console.log('Token at point:', tokenId);
      }

      setHighlightRects([touchRect]);
    })
    .onEnd(() => {
      // Re-show all token rects when gesture ends
      measureAllTokens();
    });

  const combinedGesture = Gesture.Simultaneous(longPressGesture, panGesture);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  const handleContentLayout = useCallback((event: { nativeEvent: { layout: { width: number; height: number } } }) => {
    const { width, height } = event.nativeEvent.layout;
    setContentSize({ width, height });
    setIsLayoutReady(true);
  }, []);

  return (
    <GestureDetector gesture={combinedGesture}>
      <View ref={gestureContainerRef} className="relative flex-1">
        <ScrollView
          className="flex-1 px-6 md:px-12 lg:px-20 pt-10"
          contentContainerStyle={{ paddingBottom: 96 }}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* Content container - all measurements are relative to this */}
          <View
            ref={contentContainerRef}
            className="flex-col items-start justify-start w-full max-w-3xl self-center relative"
            onLayout={handleContentLayout}
          >
            {paragraphs.map((paraTokens, paraIndex) => (
              <View key={`para-${paraIndex}`} className="mb-8 flex-wrap flex-row gap-y-2">
                {paraTokens.map((token) => {
                  const tokenKey = token._id || `token-${token.index}`;
                  return (
                    <ReaderToken
                      key={tokenKey}
                      token={token}
                      vocabMap={vocabMap}
                      selectedTokenId={selectedTokenId}
                      selectedNormalized={selectedNormalized}
                      measureRef={(node) => {
                        if (node) {
                          tokenRefs.current.set(tokenKey, node);
                        } else {
                          tokenRefs.current.delete(tokenKey);
                        }
                      }}
                      onTokenPress={onTokenPress}
                    />
                  );
                })}
              </View>
            ))}

            {/* Overlay inside content container - scrolls with content */}
            <View 
              className="absolute pointer-events-none"
              style={{
                top: 0,
                left: 0,
                width: contentSize.width,
                height: contentSize.height,
              }}
            >
              {highlightRects.map((rect, index) => (
                <View
                  key={index}
                  className="absolute bg-blue-500 opacity-50"
                  style={{
                    left: rect.x,
                    top: rect.y,
                    width: rect.width,
                    height: rect.height,
                  }}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </GestureDetector>
  );
}
