import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, Pressable, useWindowDimensions } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { useRouter } from 'expo-router';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { ReaderPage } from './ReaderPage';
import { WordDetails } from './WordDetails';
import { ProgressBar } from '@/src/components/ProgressBar';
import { StackedProgressBar } from '@/src/components/StackedProgressBar';
import { cn } from '../../lib/utils';
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';

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
  const carouselRef = useRef<ICarouselInstance>(null);
  const hasSetInitialPage = useRef(false);
  const [carouselLayout, setCarouselLayout] = useState({ width, height: 0 });

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


  const totalPages = pages.length;

  // 5. Mutations
  const updateStatusMutation = useMutation(api.vocab.updateVocabStatus);
  const updateProgressMutation = useMutation(api.lessons.updateLessonProgress);

  const handlePageSnap = useCallback(
    (newPage: number) => {
      setCurrentPage(newPage);
      setSelectedToken(null);
      setSelectedNormalized(null);
      updateProgressMutation({
        lessonId,
        currentPage: newPage,
        lastTokenIndex: newPage * WORDS_PER_PAGE,
      });
    },
    [lessonId, updateProgressMutation]
  );

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

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      const newPage = currentPage + 1;
      carouselRef.current?.scrollTo({ index: newPage, animated: true });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      const newPage = currentPage - 1;
      carouselRef.current?.scrollTo({ index: newPage, animated: true });
    }
  };

  const handleFinishLesson = () => {
    router.push(`/(app)/library/${lessonId}/summary`);
  };

  useEffect(() => {
    if (!lessonData || pages.length === 0) return;
    if (hasSetInitialPage.current) return;
    if (carouselLayout.width === 0 || carouselLayout.height === 0) return;

    const initialPage = Math.min(
      Math.max(lessonData.currentPage ?? 0, 0),
      pages.length - 1
    );

    hasSetInitialPage.current = true;
    setCurrentPage(initialPage);
    carouselRef.current?.scrollTo({ index: initialPage, animated: false });
  }, [carouselLayout.height, carouselLayout.width, lessonData, pages.length]);

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
      <View className="flex-1">
        <View className="px-5 py-4 border-b border-border/60 bg-panel/80 gap-3">
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
        <View
          className="flex-1 relative"
          onLayout={(event) => {
            const { width: layoutWidth, height: layoutHeight } = event.nativeEvent.layout;
            if (layoutWidth !== carouselLayout.width || layoutHeight !== carouselLayout.height) {
              setCarouselLayout({ width: layoutWidth, height: layoutHeight });
            }
          }}
        >
          {carouselLayout.width > 0 && carouselLayout.height > 0 && totalPages > 0 && (
            <Carousel
              ref={carouselRef}
              width={carouselLayout.width}
              height={carouselLayout.height}
              data={pages}
              loop={false}
              snapEnabled
              pagingEnabled
              scrollAnimationDuration={320}
              onSnapToItem={handlePageSnap}
              renderItem={({ item }) => (
                <ReaderPage
                  tokens={item}
                  vocabMap={vocabMap}
                  onTokenPress={(token) => {
                    setSelectedToken(token);
                    setSelectedNormalized(token.normalized || null);
                    setShouldScrollToSelected(true);
                  }}
                  selectedTokenId={selectedToken?._id}
                  selectedNormalized={selectedNormalized}
                  scrollToSelectedToken={
                    shouldScrollToSelected
                      ? () => setShouldScrollToSelected(false)
                      : undefined
                  }
                />
              )}
              onConfigurePanGesture={(gesture) => {
                gesture.activeOffsetX([-16, 16]).failOffsetY([-16, 16]);
              }}
            />
          )}

          {/* Pagination Controls */}
          <View className="absolute bottom-0 left-0 right-0 flex-row justify-between items-center px-8 py-4 bg-canvas/95 backdrop-blur-sm border-t border-border/60 md:pb-6">
            <Pressable
              onPress={handlePrevPage}
              disabled={currentPage === 0}
              className={`p-3 rounded-full ${currentPage === 0 ? 'opacity-20' : 'active:bg-muted/70'}`}
            >
              <Text className="text-2xl text-ink font-light">←</Text>
            </Pressable>

            <Text className="text-xs font-sans-semibold text-subink tracking-[0.3em] uppercase">
              Page {currentPage + 1} / {totalPages || 1}
            </Text>

            <Pressable
              onPress={currentPage === totalPages - 1 ? handleFinishLesson : handleNextPage}
              disabled={false}
              className={`p-3 rounded-full ${currentPage === totalPages - 1 ? 'active:bg-successSoft' : 'active:bg-muted/70'}`}
            >
              <Text
                className={`text-2xl font-light ${currentPage === totalPages - 1 ? 'text-success' : 'text-ink'}`}
              >
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
      </View>

      {/* Sidebar for tablets / web */}
      {isLargeScreen && selectedToken && language && (
        <View className="w-[380px] border-l border-border/70 bg-panel">
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
