import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { measureInWindow, Rect } from '../../lib/measureElement';
import { SelectionPanel } from './SelectionPanel';
import { Token, TokenStatus } from './Token';

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
  language: 'de' | 'fr' | 'ja';
  /** Called when page layout is ready (e.g., after carousel settles) */
  isActive?: boolean;
}

interface ParagraphToken extends TokenType { }

const ReaderToken = React.memo(({
  token,
  vocabMap,
  selectedTokenId,
  selectedNormalized,
  measureRef,
}: {
  token: TokenType;
  vocabMap: Record<string, number>;
  selectedTokenId: string | null;
  selectedNormalized: string | null;
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
    />
  );
});

export function ReaderPage({
  tokens,
  vocabMap,
  onTokenPress,
  selectedTokenId,
  selectedNormalized,
  language,
  isActive = true,
}: ReaderPageProps) {
  const readerColumnWidth = 768;
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
  // Use 'any' for token refs since they can be Text or View depending on platform
  const tokenRefs = useRef<Map<string, any>>(new Map());
  const tokenLayoutsRef = useRef<Map<string, Rect>>(new Map());

  // Scroll tracking - stored as plain value, updated via runOnJS
  const scrollOffsetRef = useRef(0);

  // Debug overlay rects (content-relative coordinates)
  const [highlightRects, setHighlightRects] = useState<Rect[]>([]);

  // Layout ready flag
  const [isLayoutReady, setIsLayoutReady] = useState(false);

  // Content dimensions for overlay sizing
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });

  // Offset of content container from gesture container (accounts for ScrollView padding)
  // Stored as state so it triggers re-render when it changes
  const [contentOffset, setContentOffset] = useState({ x: 0, y: 0 });

  // Track layout version to trigger re-measurement
  const [layoutVersion, setLayoutVersion] = useState(0);

  // Selection Panel State
  const [isSelectionPanelVisible, setIsSelectionPanelVisible] = useState(false);
  const [selectionPanelText, setSelectionPanelText] = useState('');

  const clearSelection = useCallback(() => {
    setTokenSelectionStartIndex(null);
    setTokenSelectionEndIndex(null);
    setIsSelectionPanelVisible(false);
    setSelectionPanelText('');
  }, []);

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
    setContentOffset({
      x: containerRect.x - gestureRect.x,
      y: containerRect.y - gestureRect.y,
    });

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
    // setHighlightRects(rects);
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
  }, [isLayoutReady, isActive, measureAllTokens, layoutVersion]);

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

  // Store current values in refs for gesture handler access
  const contentOffsetForGesture = useRef(contentOffset);
  contentOffsetForGesture.current = contentOffset;

  const getAdjustedContentPosition = useCallback((x: number, y: number) => {
    const contentX = x - contentOffsetForGesture.current.x;
    const contentY = y - contentOffsetForGesture.current.y + scrollOffsetRef.current;

    return { contentX, contentY };
  }, []);

  const findTokenAndIndex = (x: number, y: number): { tokenId: string | null; index: number | null } => {
    // // Find which token is at this point
    const tokenId = findTokenAtPoint(x, y);
    if (!tokenId) {
      return { tokenId: null, index: null };
    }

    const indexOfToken = tokens.findIndex((token) => {
      const key = token._id || `token-${token.index}`;
      return key === tokenId;
    });

    if (indexOfToken !== -1) {
      return { tokenId, index: indexOfToken };
    }

    return { tokenId: null, index: null };
  };

  const [tokenSelectionStartIndex, setTokenSelectionStartIndex] = useState<number | null>(null);
  const [tokenSelectionEndIndex, setTokenSelectionEndIndex] = useState<number | null>(null);

  const handleGestureStart = useCallback((x: number, y: number) => {
    const { contentX, contentY } = getAdjustedContentPosition(x, y);

    // If panel is visible, check if we tapped outside/start new selection
    if (isSelectionPanelVisible) {
       setIsSelectionPanelVisible(false);
       // we don't return here, we let the new selection start if applicable
    }

    const { tokenId, index } = findTokenAndIndex(contentX, contentY);
    if (tokenId && index !== null) {
      setTokenSelectionStartIndex(index);
      setTokenSelectionEndIndex(index);
    } else {
        // Tapped empty space?
    }
  }, [findTokenAndIndex, getAdjustedContentPosition, isSelectionPanelVisible]);

  const handleGestureUpdate = useCallback((x: number, y: number) => {
    const { contentX, contentY } = getAdjustedContentPosition(x, y);
    const { tokenId, index } = findTokenAndIndex(contentX, contentY);

    if (tokenId && index !== null) {
      setTokenSelectionEndIndex(index);
    }
  }, [findTokenAndIndex, getAdjustedContentPosition]);

  const handleTap = useCallback((x: number, y: number) => {
    const { contentX, contentY } = getAdjustedContentPosition(x, y);
    const { index } = findTokenAndIndex(contentX, contentY);

    if (index === null) return;

    const token = tokens[index];
    if (!token?.isWord) return;

    onTokenPress(token);
  }, [findTokenAndIndex, getAdjustedContentPosition, onTokenPress, tokens]);

  const handleGestureEnd = useCallback((x: number, y: number) => {
    // Check if we have a valid selection
    if (tokenSelectionStartIndex !== null && tokenSelectionEndIndex !== null) {
       const start = Math.min(tokenSelectionStartIndex, tokenSelectionEndIndex);
       const end = Math.max(tokenSelectionStartIndex, tokenSelectionEndIndex);
       
       // Only show panel if we selected something (and maybe more than just 1 token? or even 1 token is fine?)
       // Note: Long press on a word usually selects it via onTokenPress logic in UI if it wasn't a gesture.
       // But here we are handling swipe selection.
       
       const selectedTokens = tokens.slice(start, end + 1);
       const text = selectedTokens.map(t => t.surface).join('');
       
       if (text.trim().length > 0) {
           setSelectionPanelText(text);
           setIsSelectionPanelVisible(true);
           // Do NOT clear selection indices here, so the highlight remains
           return;
       }
    }
    
    // If no selection or empty, clear
    setTokenSelectionStartIndex(null);
    setTokenSelectionEndIndex(null);
  }, [tokenSelectionStartIndex, tokenSelectionEndIndex, tokens]);

  useEffect(() => {
    if (tokenSelectionStartIndex !== null && tokenSelectionEndIndex !== null) {
      const start = Math.min(tokenSelectionStartIndex, tokenSelectionEndIndex);
      const end = Math.max(tokenSelectionStartIndex, tokenSelectionEndIndex);

      const rects: Rect[] = [];

      // group tokens by Y coordinate and create one rect per line
      const lineMap: Map<number, { xMin: number; xMax: number, height: number }> = new Map();

      for (let i = start; i <= end; i++) {
        const token = tokens[i];
        const key = token._id || `token-${token.index}`;
        const rect = tokenLayoutsRef.current.get(key);
        if (rect) {
          const yKey = Math.round(rect.y); // group by rounded Y coordinate
          const line = lineMap.get(yKey);
          if (line) {
            line.xMin = Math.min(line.xMin, rect.x);
            line.xMax = Math.max(line.xMax, rect.x + rect.width);
          } else {
            lineMap.set(yKey, { xMin: rect.x, xMax: rect.x + rect.width, height: rect.height });
          }
        }
      }

      // Convert lineMap to rects
      for (const [y, { xMin, xMax, height }] of lineMap.entries()) {
        rects.push({
          x: xMin,
          y: y,
          width: xMax - xMin,
          height: height,
        });
      }

      setHighlightRects(rects);
    } else {
      setHighlightRects([]);
    }
  }, [tokenSelectionStartIndex, tokenSelectionEndIndex, tokens]);

  const panGesture = Gesture
    .Pan()
    .activateAfterLongPress(250)
    .onStart((e) => {
      runOnJS(handleGestureStart)(e.x, e.y);
    })
    .onUpdate((e) => {
      // Use runOnJS to call our handler on the JS thread
      runOnJS(handleGestureUpdate)(e.x, e.y);
    })
    .onEnd((e) => {
      // Re-show all token rects when gesture ends
      runOnJS(measureAllTokens)();
      runOnJS(handleGestureEnd)(e.x, e.y);
    });

  const tapGesture = Gesture
    .Tap()
    .onStart((e) => {
      runOnJS(handleTap)(e.x, e.y);
    });

  const gesturesEnabled = isActive && !isSelectionPanelVisible;

  panGesture.enabled(gesturesEnabled);
  tapGesture.enabled(gesturesEnabled);

  const combinedGesture = Gesture.Exclusive(panGesture, tapGesture);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  const handleContentLayout = useCallback((event: { nativeEvent: { layout: { width: number; height: number } } }) => {
    const { width, height } = event.nativeEvent.layout;
    // Check if size actually changed to avoid unnecessary re-renders
    setContentSize((prev) => {
      if (prev.width !== width || prev.height !== height) {
        // Trigger re-measurement on next frame
        setLayoutVersion((v) => v + 1);
        return { width, height };
      }
      return prev;
    });
    setIsLayoutReady(true);
  }, []);

  // Calculate selection bounds when highlights change
  const selectionBounds = useMemo(() => {
    if (highlightRects.length === 0) return null;
    
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const rect of highlightRects) {
      minX = Math.min(minX, rect.x);
      minY = Math.min(minY, rect.y);
      maxX = Math.max(maxX, rect.x + rect.width);
      maxY = Math.max(maxY, rect.y + rect.height);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      centerX: minX + (maxX - minX) / 2,
      bottomY: maxY,
    };
  }, [highlightRects]);

  // Calculate panel position to ensure it stays within bounds
  const selectionPanelStyle = useMemo(() => {
    if (!selectionBounds) return null;

    const PANEL_WIDTH = 300; 
    const CONTAINER_PADDING = 0; // The content container is already padded by the ScrollView

    const availableWidth = Math.max(0, contentSize.width - (CONTAINER_PADDING * 2));
    // If screen is tiny, shrink panel to fit
    const finalPanelWidth = Math.min(PANEL_WIDTH, availableWidth);
    
    // Start centered on selection
    let left = selectionBounds.centerX - (finalPanelWidth / 2);
    
    // Clamp to container bounds
    const minLeft = CONTAINER_PADDING;
    const maxLeft = contentSize.width - CONTAINER_PADDING - finalPanelWidth;
    
    // Apply clamping
    left = Math.max(minLeft, Math.min(left, maxLeft));
    
    return {
      position: 'absolute' as const,
      top: selectionBounds.bottomY + 12,
      left,
      width: finalPanelWidth,
      zIndex: 50,
    };
  }, [selectionBounds, contentSize.width]);

  return (
    <GestureDetector gesture={combinedGesture}>
      <View ref={gestureContainerRef} className="relative flex-1 items-center">
        <View className="flex-1 w-full" style={{ maxWidth: readerColumnWidth }}>
          <ScrollView
            className="flex-1 px-6 md:px-12 lg:px-20 pt-10"
            contentContainerStyle={{ paddingBottom: 96 }}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
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
                  className="absolute bg-blue-500 opacity-30"
                  style={{
                    left: rect.x - 2,
                    top: rect.y - 2,
                    width: rect.width + 4,
                    height: rect.height + 4,
                    borderRadius: 3,
                  }}
                />
              ))}
            </View>
            {/* Content container - all measurements are relative to this */}
            <View
              ref={contentContainerRef}
              className="flex-col items-start justify-start w-full relative"
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
                      />
                    );
                  })}
                </View>
              ))}

              {/* Selection UI attached to content */}
              {isSelectionPanelVisible && selectionBounds && (
                <>
                  {/* Backdrop for easy dismissal - covers content area */}
                  <Pressable 
                    onPress={clearSelection}
                    style={{
                      position: 'absolute',
                      top: -1000, 
                      left: -1000,
                      right: -1000,
                      bottom: -1000,
                      zIndex: 40,
                    }}
                  />
                  
                  {/* Panel centered relative to selection */}
                  <View 
                    style={selectionPanelStyle || {}}
                  >
                    <SelectionPanel 
                      selectedText={selectionPanelText}
                      language={language}
                      onClose={clearSelection}
                      onAsk={() => {
                        // TODO: Implement ask
                        console.log("Ask about: ", selectionPanelText);
                      }}
                    />
                  </View>
                </>
              )}
            </View>
          </ScrollView>
          
          {/* Removed old fixed position panel */}

        </View>
      </View>
    </GestureDetector>
  );
}
