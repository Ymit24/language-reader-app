import React, { useMemo } from 'react';
import { View, ScrollView, Text } from 'react-native';
import { Token, TokenStatus } from './Token';

interface ReaderPageProps {
  tokens: any[];
  vocabMap: Record<string, number>;
  onTokenPress: (token: any) => void;
  selectedTokenId: string | null;
  selectedNormalized: string | null;
}

export function ReaderPage({ tokens, vocabMap, onTokenPress, selectedTokenId, selectedNormalized }: ReaderPageProps) {

  const paragraphs = useMemo(() => {
    const paras: any[][] = [[]];
    tokens.forEach((token) => {
      // Split by double newline for paragraphs
      if (!token.isWord && token.surface.includes('\n\n')) {
        const parts = token.surface.split('\n\n');
        // Add current tokens to last para, then start new ones
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

  return (
    <ScrollView
      className="flex-1 px-6 md:px-24 py-8"
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-col items-start justify-start">
        {paragraphs.map((paraTokens, paraIndex) => (
          <Text key={`para-${paraIndex}`} className="mb-6">
            {paraTokens.map((token) => {
              const isWord = token.isWord;
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
            })}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}
