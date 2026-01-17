import React, { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Token, TokenStatus } from './Token';

interface ReaderPageProps {
  tokens: any[]; // Using any for now to match Convex return type loosely, strictly should be defined
  vocabMap: Record<string, number>; // normalized -> status
  onTokenPress: (token: any) => void;
  selectedTokenId: string | null; // Using normalized or index as ID? normalized is not unique. index is.
}

export function ReaderPage({ tokens, vocabMap, onTokenPress, selectedTokenId }: ReaderPageProps) {
  
  // Memoize the token rendering to prevent unnecessary re-renders of the list
  const renderedTokens = useMemo(() => {
    return tokens.map((token) => {
      const isWord = token.isWord;
      let status: TokenStatus = 'new';
      
      if (isWord && token.normalized) {
        const vocabStatus = vocabMap[token.normalized];
        if (vocabStatus !== undefined) {
           if (vocabStatus === 99) status = 'ignored';
           else if (vocabStatus === 4) status = 'known';
           else if (vocabStatus >= 1 && vocabStatus <= 3) status = 'learning';
           else status = 'new'; // 0
        }
      }

      // Unique key: relying on token._id or index if _id missing (but they come from Convex)
      const key = token._id || `token-${token.index}`;
      const isSelected = selectedTokenId === key;

      return (
        <Token
          key={key}
          surface={token.surface}
          isWord={isWord}
          status={status}
          isSelected={isSelected}
          onPress={isWord ? () => onTokenPress(token) : undefined}
        />
      );
    });
  }, [tokens, vocabMap, selectedTokenId, onTokenPress]);

  return (
    <ScrollView 
      className="flex-1 px-4 md:px-12 py-6"
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={true}
    >
      <View className="flex-row flex-wrap items-end">
        {renderedTokens}
      </View>
    </ScrollView>
  );
}
