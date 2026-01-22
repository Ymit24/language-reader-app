import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { View, Text } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
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
  scrollToSelectedToken?: () => void;
}

interface ParagraphToken extends TokenType {}

export const ReaderPage = React.forwardRef<ScrollView, ReaderPageProps>(({ tokens, vocabMap, onTokenPress, selectedTokenId, selectedNormalized, scrollToSelectedToken }, ref) => {
  const localRef = useRef<ScrollView>(null);
  const scrollViewRef = (ref as React.RefObject<ScrollView>) || localRef;
  const [paragraphLayouts, setParagraphLayouts] = useState<Record<number, number>>({});

  const { paragraphs, tokenToParagraphMap } = useMemo(() => {
    const paras: ParagraphToken[][] = [[]];
    const tokenToPara: Record<string, number> = {};
    let currentParaIndex = 0;

    tokens.forEach((token) => {
      const key = token._id || `token-${token.index}`;
      if (!token.isWord && token.surface.includes('\n\n')) {
        const parts = token.surface.split('\n\n');
        paras[paras.length - 1].push({ ...token, surface: parts[0] });
        tokenToPara[key] = currentParaIndex;
        for (let j = 1; j < parts.length; j++) {
          currentParaIndex++;
          paras.push([{ ...token, surface: parts[j] }]);
          tokenToPara[key] = currentParaIndex;
        }
      } else {
        tokenToPara[key] = currentParaIndex;
        paras[paras.length - 1].push(token);
      }
    });
    return { paragraphs: paras, tokenToParagraphMap: tokenToPara };
  }, [tokens]);

  const triggerScroll = useCallback(() => {
    if (selectedTokenId && paragraphLayouts) {
      const paraIndex = tokenToParagraphMap[selectedTokenId];
      if (paraIndex !== undefined && paragraphLayouts[paraIndex] !== undefined) {
        scrollViewRef.current?.scrollTo({
          y: paragraphLayouts[paraIndex] - 80,
          animated: true,
        });
      }
    }
  }, [selectedTokenId, paragraphLayouts, tokenToParagraphMap]);

  useEffect(() => {
    if (selectedTokenId && scrollToSelectedToken) {
      const timeout = setTimeout(triggerScroll, 100);
      return () => clearTimeout(timeout);
    }
  }, [selectedTokenId, scrollToSelectedToken, triggerScroll]);

  return (
    <ScrollView
      ref={scrollViewRef}
      className="flex-1 px-6 md:px-12 lg:px-24 py-8"
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-col items-start justify-start">
        {paragraphs.map((paraTokens, paraIndex) => (
          <Text
            key={`para-${paraIndex}`}
            className="mb-6"
            onLayout={(e) => {
              const event = e.nativeEvent;
              if (event != null && event.layout != null && event.layout.y !== undefined) {
                setParagraphLayouts((prev) => ({
                  ...prev,
                  [paraIndex]: event.layout.y,
                }));
              }
            }}
          >
            {paraTokens.map((token) => {
              const isWord: boolean = token.isWord;
              let status: TokenStatus = 'new';
              let learningLevel: number | undefined;

              if (isWord && token.normalized) {
                const vocabStatus = vocabMap[token.normalized];
                if (vocabStatus !== undefined) {
                  if (vocabStatus === 4) {
                    status = 'known';
                  } else if (vocabStatus >= 1 && vocabStatus <= 3) {
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
                  key={key}
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
            })}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
});

ReaderPage.displayName = 'ReaderPage';
