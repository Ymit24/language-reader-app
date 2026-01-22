import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ActivityIndicator, Pressable, useWindowDimensions, Platform } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useQuery, useMutation } from 'convex/react';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { ReaderPage } from './ReaderPage';
import { WordDetails } from './WordDetails';
import { ProgressBar } from '@/src/components/ProgressBar';
import { StackedProgressBar } from '@/src/components/StackedProgressBar';
import { cn } from '../../lib/utils';

interface ReaderProps {
  lessonId: Id<"lessons">;
}

const STATUS_NEW = 0;
const STATUS_LEARNING_MIN = 1;
const STATUS_LEARNING_MAX = 3;
const STATUS_KNOWN = 4;

export function Reader({ lessonId }: ReaderProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  // 1. Fetch Lesson Data
  const lessonData = useQuery(api.lessons.getLesson, { lessonId });
  
  // 2. Fetch Vocab Data (Dependent on lesson language)
  // We need to know the language first.
  const language = lessonData?.language;
  const vocabData = useQuery(api.vocab.getVocabProfile, language ? { language } : "skip");

  // 3. Local State
  const [selectedToken, setSelectedToken] = useState<any | null>(null);
  const [selectedNormalized, setSelectedNormalized] = useState<string | null>(null);
  const [shouldScrollToSelected, setShouldScrollToSelected] = useState(false);
  const [currentPage, setCurrentPage] = useState(() => {
    if (lessonData?.currentPage !== undefined) {
      return Math.max(0, lessonData.currentPage);
    }
    return 0;
  });

  const WORDS_PER_PAGE = 200;

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

  // 4b. Calculate vocab status counts for entire lesson
  const vocabCounts = useMemo(() => {
    const counts = { new: 0, learning: 0, known: 0 };
    if (!lessonData?.tokens) return counts;

    const seenTerms = new Set<string>();

    for (const token of lessonData.tokens) {
      if (!token.isWord) continue;
      const term = token.normalized;
      if (!term || seenTerms.has(term)) continue;
      seenTerms.add(term);

      const status = vocabMap[term] ?? STATUS_NEW;
      if (status === STATUS_NEW) counts.new++;
      else if (status >= STATUS_LEARNING_MIN && status <= STATUS_LEARNING_MAX) counts.learning++;
      else if (status === STATUS_KNOWN) counts.known++;
    }

    return counts;
  }, [lessonData?.tokens, vocabMap]);

  // Pagination Logic
  const pages = useMemo(() => {
    if (!lessonData?.tokens) return [];
    
    const allTokens = lessonData.tokens;
    const pagesArray: any[][] = [];
    let currentChunk: any[] = [];
    let wordCount = 0;

    for (let i = 0; i < allTokens.length; i++) {
      const token = allTokens[i];
      currentChunk.push(token);
      if (token.isWord) {
        wordCount++;
      }
      
      if (wordCount >= WORDS_PER_PAGE) {
        const isParagraphBreak = !token.isWord && token.surface.includes('\n\n');
        const isSentenceEnd = !token.isWord && /[.!?]/.test(token.surface);
        const isForced = wordCount >= WORDS_PER_PAGE * 1.5;

        if (isParagraphBreak || isSentenceEnd || isForced) {
          // Consume trailing non-word tokens (punctuation, but NOT new paragraphs)
          let j = i + 1;
          while (j < allTokens.length) {
            const next = allTokens[j];
            if (next.isWord) break;
            if (next.surface.includes('\n\n')) break;
            
            currentChunk.push(next);
            i = j;
            j++;
          }
          
          pagesArray.push(currentChunk);
          currentChunk = [];
          wordCount = 0;
        }
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
  const updateProgressMutation = useMutation(api.lessons.updateLessonProgress);

  const triggerHaptic = useCallback((type: 'success' | 'error' | 'warning' | 'selection' | 'impact') => {
    if (Platform.OS !== 'web') {
      switch (type) {
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'error':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'selection':
          Haptics.selectionAsync();
          break;
        case 'impact':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
      }
    }
  }, []);

  const handleUpdateStatus = async (newStatus: number) => {
    if (!selectedToken || !language) return;

    const term = selectedToken.normalized;

    await updateStatusMutation({
      language,
      term,
      status: newStatus,
    });

    setSelectedToken(null);
    setSelectedNormalized(null);
  };

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(p => p + 1);
      setSelectedToken(null);
      setSelectedNormalized(null);
      const newPage = currentPage + 1;
      updateProgressMutation({
        lessonId,
        currentPage: newPage,
        lastTokenIndex: newPage * WORDS_PER_PAGE,
      });
      triggerHaptic('impact');
    }
  }, [currentPage, totalPages, lessonId, updateProgressMutation, triggerHaptic]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(p => p - 1);
      setSelectedToken(null);
      setSelectedNormalized(null);
      const newPage = currentPage - 1;
      updateProgressMutation({
        lessonId,
        currentPage: newPage,
        lastTokenIndex: newPage * WORDS_PER_PAGE,
      });
      triggerHaptic('impact');
    }
  }, [currentPage, lessonId, updateProgressMutation, triggerHaptic]);

  const handleFinishLesson = () => {
    router.push(`/(app)/library/${lessonId}/summary`);
  };

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-30, 30])
    .failOffsetY([-30, 30])
    .onEnd((event) => {
      const SWIPE_THRESHOLD = 50;
      if (event.translationX > SWIPE_THRESHOLD) {
        handlePrevPage();
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        handleNextPage();
      }
    });

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
    <View className={cn("flex-1 bg-canvas", isLargeScreen ? "flex-row" : "flex-col")}>
      <View className="flex-1 relative">
        <View className="px-4 py-3 border-b border-gray-100 gap-3">
          <ProgressBar
            progress={totalPages > 0 ? ((currentPage + 1) / totalPages) * 100 : 0}
            color="brand"
            height={6}
            showLabel
            label={`Page ${currentPage + 1} of ${totalPages || 1}`}
          />
          <StackedProgressBar
            counts={vocabCounts}
            total={vocabCounts.new + vocabCounts.learning + vocabCounts.known}
            height={6}
          />
        </View>
        <GestureDetector gesture={swipeGesture}>
          <View className="flex-1">
            <ReaderPage 
              tokens={currentTokens}
              vocabMap={vocabMap}
              onTokenPress={(token) => {
                setSelectedToken(token);
                setSelectedNormalized(token.normalized || null);
                setShouldScrollToSelected(true);
              }}
              selectedTokenId={selectedToken?._id}
              selectedNormalized={selectedNormalized}
              scrollToSelectedToken={shouldScrollToSelected ? () => setShouldScrollToSelected(false) : undefined}
            />
          </View>
        </GestureDetector>
        
        {/* Pagination Controls */}
        <View className="absolute bottom-0 left-0 right-0 flex-row justify-between items-center px-8 py-4 bg-canvas/95 backdrop-blur-sm border-t border-gray-100/50 md:pb-6">
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
                onPress={currentPage === totalPages - 1 ? handleFinishLesson : handleNextPage} 
                disabled={false}
                className={`p-3 rounded-full ${currentPage === totalPages - 1 ? 'active:bg-green-50' : 'active:bg-gray-100'}`}
            >
                <Text className={`text-2xl font-light ${currentPage === totalPages - 1 ? 'text-green-600' : 'text-ink'}`}>
                  {currentPage === totalPages - 1 ? "✓" : "→"}
                </Text>
            </Pressable>
        </View>

        {selectedToken && !isLargeScreen && language && (
            <WordDetails
                mode="popup"
                surface={selectedToken.surface}
                normalized={selectedToken.normalized}
                language={language}
                currentStatus={vocabMap[selectedToken.normalized] ?? 0}
                onUpdateStatus={handleUpdateStatus}
                onClose={() => {
                  setSelectedToken(null);
                  setSelectedNormalized(null);
                }}
            />
        )}
      </View>

      {/* Sidebar for tablets / web */}
      {isLargeScreen && selectedToken && language && (
        <View className="w-[380px] border-l border-border/50 bg-white">
          <WordDetails
            mode="sidebar"
            surface={selectedToken.surface}
            normalized={selectedToken.normalized}
            language={language}
            currentStatus={vocabMap[selectedToken.normalized] ?? 0}
            onUpdateStatus={handleUpdateStatus}
            onClose={() => {
              setSelectedToken(null);
              setSelectedNormalized(null);
            }}
          />
        </View>
      )}
    </View>
  );
}
