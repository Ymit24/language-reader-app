import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { ReaderPage } from './ReaderPage';
import { WordDetails } from './WordDetails';

interface ReaderProps {
  lessonId: Id<"lessons">;
}

export function Reader({ lessonId }: ReaderProps) {
  // 1. Fetch Lesson Data
  const lessonData = useQuery(api.lessons.getLesson, { lessonId });
  
  // 2. Fetch Vocab Data (Dependent on lesson language)
  // We need to know the language first.
  const language = lessonData?.language;
  const vocabData = useQuery(api.vocab.getVocabProfile, language ? { language } : "skip");

  // 3. Local State
  const [selectedToken, setSelectedToken] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const WORDS_PER_PAGE = 150; // Conservative for mobile screens

  // 4. Transform Vocab for fast lookup
  const vocabMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (vocabData) {
      for (const v of vocabData) {
        map[v.term] = v.status;
      }
    }
    return map;
  }, [vocabData]);

  // Pagination Logic
  const pages = useMemo(() => {
    if (!lessonData?.tokens) return [];
    
    const allTokens = lessonData.tokens;
    const pagesArray: any[][] = [];
    let currentChunk: any[] = [];
    let wordCount = 0;

    for (const token of allTokens) {
      currentChunk.push(token);
      if (token.isWord) {
        wordCount++;
      }
      
      // Split when we hit the limit, but try to respect sentence endings if possible?
      // For MVP, strict word count limit is fine. 
      // A better approach is paragraph based, but we don't have paragraph markers explicitly in tokens unless we parse newline tokens.
      if (wordCount >= WORDS_PER_PAGE) {
          // If the last token was not a sentence closer, maybe look ahead?
          // Let's just hard split for now.
          pagesArray.push(currentChunk);
          currentChunk = [];
          wordCount = 0;
      }
    }
    if (currentChunk.length > 0) {
      pagesArray.push(currentChunk);
    }
    return pagesArray;
  }, [lessonData]);

  const currentTokens = pages[currentPage] || [];
  const totalPages = pages.length;

  // 5. Mutations
  const updateStatusMutation = useMutation(api.vocab.updateVocabStatus);

  const handleUpdateStatus = async (newStatus: number) => {
    if (!selectedToken || !language) return;

    const term = selectedToken.normalized;
    
    await updateStatusMutation({
      language,
      term,
      status: newStatus,
    });
    
    if (newStatus === 4 || newStatus === 99) {
        setSelectedToken(null);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(p => p + 1);
      setSelectedToken(null);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(p => p - 1);
      setSelectedToken(null);
    }
  };

  if (lessonData === undefined) {
    return (
      <View className="flex-1 justify-center items-center bg-canvas">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (lessonData === null) {
    return (
      <View className="flex-1 justify-center items-center bg-canvas">
        <Text>Lesson not found.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-canvas relative">
        <ReaderPage 
          tokens={currentTokens}
          vocabMap={vocabMap}
          onTokenPress={setSelectedToken}
          selectedTokenId={selectedToken?._id}
        />
        
        {/* Pagination Controls */}
        <View className="absolute bottom-0 left-0 right-0 flex-row justify-between items-center px-8 py-6 bg-canvas/95 backdrop-blur-sm border-t border-gray-100/50 pb-10 md:pb-6">
            <Pressable 
                onPress={handlePrevPage} 
                disabled={currentPage === 0}
                className={`p-3 rounded-full ${currentPage === 0 ? 'opacity-20' : 'active:bg-gray-100'}`}
            >
                {/* Minimal arrow */}
                <Text className="text-2xl text-ink font-light">←</Text>
            </Pressable>
            
            <Text className="text-sm font-medium text-subink tracking-widest uppercase">
                Page {currentPage + 1} / {totalPages || 1}
            </Text>

            <Pressable 
                onPress={handleNextPage} 
                disabled={currentPage === totalPages - 1}
                className={`p-3 rounded-full ${currentPage === totalPages - 1 ? 'opacity-20' : 'active:bg-gray-100'}`}
            >
                <Text className="text-2xl text-ink font-light">→</Text>
            </Pressable>
        </View>

        {selectedToken && (
            <WordDetails 
                surface={selectedToken.surface}
                normalized={selectedToken.normalized}
                currentStatus={vocabMap[selectedToken.normalized] ?? 0}
                onUpdateStatus={handleUpdateStatus}
                onClose={() => setSelectedToken(null)}
            />
        )}
    </View>
  );
}
