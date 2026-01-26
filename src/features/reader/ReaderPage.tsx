import React, { Ref, useMemo, useRef, useState } from 'react';
import { findNodeHandle, Platform, ScrollView, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
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
}

interface ParagraphToken extends TokenType { }

const ReaderToken = React.memo(({
  token,
  vocabMap,
  selectedTokenId,
  selectedNormalized,
  onTokenPress,
  onTokenLayout,
  ref,
}: {
  token: TokenType;
  vocabMap: Record<string, number>;
  selectedTokenId: string | null;
  selectedNormalized: string | null;
  onTokenPress: (token: TokenType) => void;
  onTokenLayout: (tokenId: string, layout: { x: number; y: number; width: number; height: number }) => void;
  ref: Ref<Text>;
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
      ref={ref}
      surface={token.surface}
      isWord={isWord}
      status={status}
      learningLevel={learningLevel}
      isSelected={isSelected}
      normalized={token.normalized}
      onLayout={(event) => {
        onTokenLayout(key, event.nativeEvent.layout);
      }}
      isWordSelected={isWordSelected}
      onPress={isWord ? (() => onTokenPress(token)) : undefined}
    />
  );
});

export function ReaderPage({ tokens, vocabMap, onTokenPress, selectedTokenId, selectedNormalized }: ReaderPageProps) {
  const paragraphs = useMemo(() => {
    const paras: ParagraphToken[][] = [[]];
    let currentParaIndex = 0;

    tokens.forEach((token) => {
      if (!token.isWord && token.surface.includes('\n\n')) {
        const parts = token.surface.split('\n\n');
        paras[paras.length - 1].push({ ...token, surface: parts[0] });
        for (let j = 1; j < parts.length; j++) {
          currentParaIndex++;
          paras.push([{ ...token, surface: parts[j] }]);
        }
      } else {
        paras[paras.length - 1].push(token);
      }
    });
    return paras;
  }, [tokens]);

  const tokenLayoutRefs = useRef<Map<string, { x: number; y: number; width: number; height: number }>>(new Map());

  const [highlightRects, setHighlightRects] = useState<Array<{ x: number; y: number; width: number; height: number }>>([]);

  const longPressGesture = Gesture
    .LongPress()
    .minDuration(500);

  const panGesture = Gesture
    .Pan()
    .onUpdate((e) => {
      const newRect = {
        x: e.x,
        y: e.y,
        width: 50,
        height: 50,
      };
      setHighlightRects((prevRects) => [newRect]);
    })
    .onEnd((e) => {
      setHighlightRects([]);
    });

  const combinedGesture = Gesture.Simultaneous(longPressGesture, panGesture)

  const overlayRef = useRef<View>(null);
  const tokenRefs = useRef<Map<string, Text>>(new Map());

  return (
    <GestureDetector gesture={combinedGesture}>
      <View className='relative flex-1'>
        <ScrollView
          className="flex-1 px-6 md:px-12 lg:px-20 pt-10"
          contentContainerStyle={{ paddingBottom: 96 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-col items-start justify-start w-full max-w-3xl self-center">
            {paragraphs.map((paraTokens, paraIndex) => (
              <View key={`para-${paraIndex}`} className="mb-8 flex-wrap flex-row gap-y-2">
                {paraTokens.map((token) => (
                  <ReaderToken
                    key={token._id || `token-${token.index}`}
                    token={token}
                    vocabMap={vocabMap}
                    selectedTokenId={selectedTokenId}
                    selectedNormalized={selectedNormalized}
                    ref={(node) => {
                      if (node) {
                        tokenRefs.current.set(token._id || `token-${token.index}`, node);
                      } else {
                        tokenRefs.current.delete(token._id || `token-${token.index}`);
                      }
                    }}
                    onTokenPress={onTokenPress}
                    onTokenLayout={(tokenId, layout) => {
                      tokenLayoutRefs.current.set(tokenId, layout);
                      if (Platform.OS !== "web") {
                        const handle = findNodeHandle(overlayRef.current);
                        const tokenRef = tokenRefs.current.get(tokenId);
                        if (!handle || !tokenRef?.measureLayout) {
                          console.log('Cannot measure layout for token:', tokenId);
                          return;
                        }
                        tokenRef.measureLayout(
                          handle,
                          (x, y, width, height) => {
                            console.log(`Measured layout for token ${tokenId}: x=${x}, y=${y}, width=${width}, height=${height}`);
                            setHighlightRects((prev) => [...prev, {
                              x,
                              y,
                              width,
                              height,
                            }]);
                          },
                          () => {
                            console.log('Error measuring layout for token:', tokenId);
                          }
                        )
                      } else {
                        const overlayNode = overlayRef.current as any;
                        const tokenNode = tokenRefs.current.get(tokenId) as any;
                        if (!overlayNode || !tokenNode) {
                          console.log('Cannot measure layout for token (web):', tokenId);
                          return;
                        }
                        const overlayRect = overlayNode.getBoundingClientRect();
                        const tokenRect = tokenNode.getBoundingClientRect();
                        const relativeRect = {
                          x: tokenRect.x - overlayRect.x,
                          y: tokenRect.y - overlayRect.y,
                          width: tokenRect.width,
                          height: tokenRect.height,
                        };

                        setHighlightRects((prev) => [...prev, relativeRect]);
                      }

                      // console.log('layout: x=', layout.x, ' y=', layout.y, ' width=', layout.width, ' height=', layout.height);
                      // setHighlightRects((prev) => [...prev, {
                      //   x: layout.x,
                      //   y: layout.y,
                      //   width: layout.width,
                      //   height: layout.height,
                      // }])
                      // if (tokenLayoutRefs.current.size === tokens.length) {

                      // }
                    }}
                  />
                ))}
              </View>
            ))}
          </View>
        </ScrollView>

        <View ref={overlayRef} className="absolute inset-0 pointer-events-none">
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
    </GestureDetector>
  );
}
