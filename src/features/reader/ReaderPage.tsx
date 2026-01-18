import React, { useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { Token, TokenStatus } from './Token';

interface ReaderPageProps {
  tokens: any[];
  vocabMap: Record<string, number>;
  onTokenPress: (token: any) => void;
  selectedTokenId: string | null;
  selectedNormalized: string | null;
}

export function ReaderPage({ tokens, vocabMap, onTokenPress, selectedTokenId, selectedNormalized }: ReaderPageProps) {

  const renderedTokens = useMemo(() => {
    return tokens.map((token) => {
      const isWord = token.isWord;
      let status: TokenStatus = 'new';
      let learningLevel: number | undefined;

      if (isWord && token.normalized) {
        const vocabStatus = vocabMap[token.normalized];
        if (vocabStatus !== undefined) {
          if (vocabStatus === 99) {
            status = 'ignored';
          } else if (vocabStatus === 4) {
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
      const isWordSelected = isWord && token.normalized && token.normalized === selectedNormalized;

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
          onPress={isWord ? () => onTokenPress(token) : undefined}
        />
      );
    });
  }, [tokens, vocabMap, selectedTokenId, selectedNormalized, onTokenPress]);

  return (
    <ScrollView
      className="flex-1 px-6 md:px-24 py-8"
      contentContainerStyle={{ paddingBottom: 80 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-row flex-wrap items-end justify-start">
        {renderedTokens}
      </View>
    </ScrollView>
  );
}
