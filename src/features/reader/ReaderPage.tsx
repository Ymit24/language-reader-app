import React, { useMemo } from 'react';
import { View, ScrollView, Text } from 'react-native';
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

interface ParagraphToken extends TokenType {}

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

  return (
    <ScrollView
      className="flex-1 px-6 md:px-12 lg:px-20 pt-10"
      contentContainerStyle={{ paddingBottom: 96 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-col items-start justify-start w-full max-w-3xl self-center">
        {paragraphs.map((paraTokens, paraIndex) => (
          <Text key={`para-${paraIndex}`} className="mb-8">
            {paraTokens.map((token) => {
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
}
