import { useMutation } from 'convex/react';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { api } from '../../../convex/_generated/api';
import { Doc, Id } from '../../../convex/_generated/dataModel';
import { ReaderPage } from './ReaderPage';
import { PaginationControls } from './PaginationControls';
import { ReaderInspector } from './ReaderInspector';
import { useReaderCarousel } from './hooks/useReaderCarousel';
import { useReaderVocab } from './hooks/useReaderVocab';
import { useReaderInspector } from './hooks/useReaderInspector';

interface ReaderProps {
  lesson: Doc<"lessons"> & { tokens: Doc<"lessonTokens">[] };
  isScreenFocused?: boolean;
}

const STATUS_NEW = 0;
const WORDS_PER_PAGE = 200;

export function Reader({ lesson, isScreenFocused = true }: ReaderProps) {
  const router = useRouter();
  const progressUpdateTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const language = lesson.language;

  // Custom hooks for state management
  const { vocabMap, isVocabLoading, setLocalStatusOverrides } = useReaderVocab({
    language,
  });

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Pagination Logic
  const pages = useMemo(() => {
    if (!lesson.tokens) return [];

    const allTokens = lesson.tokens;
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
        const isParagraphBreak =
          !token.isWord && token.surface.includes('\n\n');
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
  }, [lesson.tokens]);

  const totalPages = pages.length;

  const carousel = useReaderCarousel({
    initialPage: lesson.currentPage ?? 0,
    totalPages,
  });

  const inspector = useReaderInspector();

  // Mutations
  const updateStatusMutation = useMutation(api.vocab.updateVocabStatus);
  const updateProgressMutation = useMutation(api.lessons.updateLessonProgress);

  const handlePageSnap = useCallback(
    (newPage: number) => {
      carousel.setCurrentPage(newPage);
      inspector.closeInspector();

      if (progressUpdateTimer.current) {
        clearTimeout(progressUpdateTimer.current);
      }
      progressUpdateTimer.current = setTimeout(() => {
        updateProgressMutation({
          lessonId: lesson._id as Id<"lessons">,
          currentPage: newPage,
          lastTokenIndex: newPage * WORDS_PER_PAGE,
        });
      }, 240);
    },
    [lesson._id, updateProgressMutation, carousel, inspector]
  );

  const handleUpdateStatus = async (newStatus: number) => {
    if (!inspector.selectedToken || !language || !inspector.selectedToken.normalized) return;

    const term = inspector.selectedToken.normalized;
    const previousStatus = vocabMap[term] ?? STATUS_NEW;

    setLocalStatusOverrides((prev) => ({ ...prev, [term]: newStatus }));
    setIsUpdatingStatus(true);

    try {
      await updateStatusMutation({
        language,
        term,
        status: newStatus,
      });
    } catch (error) {
      setLocalStatusOverrides((prev) => ({ ...prev, [term]: previousStatus }));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleFinishLesson = () => {
    router.push(`/(app)/library/${lesson._id}/summary`);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (progressUpdateTimer.current) {
        clearTimeout(progressUpdateTimer.current);
      }
    };
  }, []);

  const hasPages = totalPages > 0;
  const canGoPrev = carousel.currentPage > 0;
  const isLastPage = carousel.currentPage === totalPages - 1;
  const showInspector = Boolean(
    inspector.selectedToken &&
      language &&
      (carousel.isLargeScreen || inspector.isInspectorOpen)
  );

  return (
    <View className="flex-1 bg-canvas">
      <View className="flex-1" style={{ minHeight: 1 }}>
        <View className="flex-1 items-center">
          <View className="flex-1" style={{ width: carousel.readerFrameWidth }}>
            <View
              className="flex-1"
              style={{ minHeight: 1 }}
              onLayout={(event) => {
                const { height: layoutHeight } = event.nativeEvent.layout;
                carousel.handleLayoutChange(layoutHeight);
              }}
            >
              {hasPages ? (
                <Carousel
                  ref={carousel.carouselRef}
                  width={carousel.carouselWidth}
                  height={carousel.carouselHeight}
                  style={{
                    flex: 1,
                    height: carousel.carouselHeight,
                    width: '100%',
                  }}
                  data={pages}
                  loop={false}
                  snapEnabled
                  pagingEnabled
                  scrollAnimationDuration={320}
                  onSnapToItem={handlePageSnap}
                  renderItem={({ item, index }) => (
                    <ReaderPage
                      tokens={item}
                      vocabMap={vocabMap}
                      language={language}
                      onTokenPress={(token) => {
                        inspector.openInspector(token);
                      }}
                      selectedTokenId={inspector.selectedToken?._id ?? null}
                      selectedNormalized={inspector.selectedNormalized}
                      isActive={isScreenFocused && index === carousel.currentPage}
                    />
                  )}
                  onConfigurePanGesture={(gesture) => {
                    gesture.activeOffsetX([-16, 16]).failOffsetY([-16, 16]);
                  }}
                />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Text className="text-base text-subink font-sans-medium">
                    No text available for this lesson.
                  </Text>
                </View>
              )}
            </View>

            <PaginationControls
              currentPage={carousel.currentPage}
              totalPages={totalPages}
              isVocabLoading={isVocabLoading}
              isLastPage={isLastPage}
              canGoPrev={canGoPrev}
              hasPages={hasPages}
              onPrevPage={carousel.prevPage}
              onNextPage={carousel.nextPage}
              onFinishLesson={handleFinishLesson}
            />
          </View>
        </View>
      </View>

      {showInspector &&
        inspector.selectedToken &&
        inspector.selectedToken.normalized && (
          <ReaderInspector
            isVisible={showInspector}
            isLargeScreen={carousel.isLargeScreen}
            surface={inspector.selectedToken.surface}
            normalized={inspector.selectedToken.normalized}
            language={language}
            currentStatus={
              vocabMap[inspector.selectedToken.normalized] ?? STATUS_NEW
            }
            isUpdating={isUpdatingStatus}
            onUpdateStatus={handleUpdateStatus}
            onClose={inspector.closeInspector}
          />
        )}
    </View>
  );
}
