import { useAppTheme } from '@/src/theme/AppThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutRectangle, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { GestureType } from 'react-native-gesture-handler';
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';
import { api } from '../../../convex/_generated/api';
import { Doc, Id } from '../../../convex/_generated/dataModel';
import { cn } from '../../lib/utils';
import { PhraseTranslationPopup } from './PhraseTranslationPopup';
import { ReaderPage } from './ReaderPage';
import { TokenType } from './TextSelectionProvider';
import { WordDetails } from './WordDetails';

interface ReaderProps {
  lesson: Doc<'lessons'> & { tokens: Doc<'lessonTokens'>[] };
}

interface ReaderToken {
  _id?: string;
  index?: number;
  isWord: boolean;
  surface: string;
  normalized?: string;
}

const STATUS_NEW = 0;

const INSPECTOR_WIDTH = 360;

export function Reader({ lesson }: ReaderProps) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { width, height: windowHeight } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const carouselRef = useRef<ICarouselInstance>(null);
  const hasSetInitialPage = useRef(false);
  const layoutUpdateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressUpdateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackCarouselHeight = useMemo(() => {
    // Leave room for the app header + reader card padding + the in-card footer.
    // Keep a sane minimum so the carousel mounts on first layout.
    return Math.max(windowHeight - 320, 260);
  }, [windowHeight]);
  const [carouselLayout, setCarouselLayout] = useState({ width, height: fallbackCarouselHeight });
  const carouselWidth = carouselLayout.width > 0 ? carouselLayout.width : width;
  const carouselHeight = carouselLayout.height > 0 ? carouselLayout.height : fallbackCarouselHeight;

  const language = lesson.language;
  const vocabData = useQuery(api.vocab.getVocabProfile, language ? { language } : 'skip');

  const [selectedToken, setSelectedToken] = useState<ReaderToken | null>(null);
  const [selectedNormalized, setSelectedNormalized] = useState<string | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(() => Math.max(0, lesson.currentPage ?? 0));
  const [localStatusOverrides, setLocalStatusOverrides] = useState<Record<string, number>>({});
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Phrase selection state
  const [selectedPhraseTokens, setSelectedPhraseTokens] = useState<TokenType[] | null>(null);
  const [phraseSelectionBounds, setPhraseSelectionBounds] = useState<LayoutRectangle | null>(null);
  const clearSelectionRef = useRef<(() => void) | null>(null);

  const WORDS_PER_PAGE = 200;

  // 4. Transform Vocab for fast lookup
  const vocabMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (vocabData) {
      for (const v of vocabData) {
        map[v.term] = v.status;
      }
    }
    for (const [term, status] of Object.entries(localStatusOverrides)) {
      map[term] = status;
    }
    return map;
  }, [vocabData, localStatusOverrides]);

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
  }, [lesson.tokens]);

  const totalPages = pages.length;

  // 5. Mutations
  const updateStatusMutation = useMutation(api.vocab.updateVocabStatus);
  const updateProgressMutation = useMutation(api.lessons.updateLessonProgress);

  const handlePageSnap = useCallback(
    (newPage: number) => {
      setCurrentPage(newPage);
      setSelectedToken(null);
      setSelectedNormalized(null);
      setIsInspectorOpen(false);
      // Clear phrase selection when changing pages
      setSelectedPhraseTokens(null);
      setPhraseSelectionBounds(null);
      // Also clear selection state in the provider
      clearSelectionRef.current?.();

      if (progressUpdateTimer.current) {
        clearTimeout(progressUpdateTimer.current);
      }
      progressUpdateTimer.current = setTimeout(() => {
        updateProgressMutation({
          lessonId: lesson._id as Id<'lessons'>,
          currentPage: newPage,
          lastTokenIndex: newPage * WORDS_PER_PAGE,
        });
      }, 240);
    },
    [lesson._id, updateProgressMutation]
  );

  const handleUpdateStatus = async (newStatus: number) => {
    if (!selectedToken || !language || !selectedToken.normalized) return;

    const term = selectedToken.normalized;
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

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      carouselRef.current?.scrollTo({ count: 1, animated: true });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      carouselRef.current?.scrollTo({ count: -1, animated: true });
    }
  };

  const handleFinishLesson = () => {
    router.push(`/(app)/library/${lesson._id}/summary`);
  };

  // Handle phrase selection completion
  const handlePhraseSelectionComplete = useCallback(
    (tokens: TokenType[], bounds: LayoutRectangle | null) => {
      // Close any open word details panel
      setSelectedToken(null);
      setSelectedNormalized(null);
      setIsInspectorOpen(false);

      // Set selected phrase tokens
      setSelectedPhraseTokens(tokens);

      setPhraseSelectionBounds(bounds);
    },
    []
  );

  // Handle phrase popup dismiss
  const handlePhraseDismiss = useCallback(() => {
    setSelectedPhraseTokens(null);
    setPhraseSelectionBounds(null);
    // Clear selection state in the provider
    clearSelectionRef.current?.();
  }, []);

  // Generate phrase text from selected tokens
  const selectedPhraseText = useMemo(() => {
    if (!selectedPhraseTokens) return '';
    return selectedPhraseTokens.map((t) => t.surface).join('');
  }, [selectedPhraseTokens]);

  useEffect(() => {
    if (!lesson || pages.length === 0) return;
    if (hasSetInitialPage.current) return;
    if (carouselLayout.width === 0 || carouselLayout.height === 0) return;

    const initialPage = Math.min(Math.max(lesson.currentPage ?? 0, 0), pages.length - 1);

    hasSetInitialPage.current = true;
    setCurrentPage(initialPage);
    carouselRef.current?.scrollTo({ index: initialPage, animated: false });
  }, [carouselLayout.height, carouselLayout.width, lesson, pages.length]);

  useEffect(() => {
    return () => {
      if (layoutUpdateTimer.current) {
        clearTimeout(layoutUpdateTimer.current);
      }
      if (progressUpdateTimer.current) {
        clearTimeout(progressUpdateTimer.current);
      }
    };
  }, []);

  const hasPages = totalPages > 0;
  const canGoPrev = currentPage > 0;
  const isLastPage = currentPage === totalPages - 1;
  const showInspector = Boolean(
    selectedToken && language && (isLargeScreen || isInspectorOpen) && !selectedPhraseTokens
  );
  const showPhrasePopup = Boolean(selectedPhraseTokens && selectedPhraseTokens.length > 0);

  const selectionGestureRef = useRef<GestureType | undefined>(undefined);

  const handleSelectionGestureRef = useCallback(
    (ref: React.RefObject<GestureType | undefined>) => {
      selectionGestureRef.current = ref.current;
    },
    []
  );

  return (
    <View className="flex-1 bg-canvas">
      <View className="flex-1" style={{ minHeight: 1 }}>
        <View className="flex-1 px-4 pt-4 pb-6">
          <View className="flex-1 bg-panel/90 border border-border/70 rounded-3xl shadow-card overflow-hidden">
            <View
              className="flex-1"
              style={{ minHeight: 1 }}
              onLayout={(event) => {
                const { width: layoutWidth, height: layoutHeight } = event.nativeEvent.layout;
                if (layoutWidth === 0 || layoutHeight === 0) return;

                if (
                  layoutWidth !== carouselLayout.width ||
                  layoutHeight !== carouselLayout.height
                ) {
                  if (layoutUpdateTimer.current) {
                    clearTimeout(layoutUpdateTimer.current);
                  }
                  layoutUpdateTimer.current = setTimeout(() => {
                    setCarouselLayout({ width: layoutWidth, height: layoutHeight });
                  }, 80);
                }
              }}
            >
              {hasPages ? (
                <Carousel
                  ref={carouselRef}
                  width={carouselWidth}
                  height={carouselHeight}
                  style={{ flex: 1, height: carouselHeight, width: '100%' }}
                  data={pages}
                  loop={false}
                  snapEnabled
                  pagingEnabled
                  scrollAnimationDuration={320}
                  onSnapToItem={handlePageSnap}
                  renderItem={({ item, index }) => (
                    <ReaderPage
                      key={`page-${index}`}
                      tokens={item}
                      vocabMap={vocabMap}
                      onTokenPress={(token) => {
                        // Only open word details if no phrase selection
                        if (!showPhrasePopup) {
                          setSelectedToken(token);
                          setSelectedNormalized(token.normalized || null);
                          setIsInspectorOpen(true);
                        }
                      }}
                      selectedTokenId={selectedToken?._id ?? null}
                      selectedNormalized={selectedNormalized}
                      onSelectionGestureRef={
                        index === currentPage ? handleSelectionGestureRef : undefined
                      }
                      isActivePage={index === currentPage}
                      onClearSelectionReady={(clearSelection: () => void) => {
                        clearSelectionRef.current = clearSelection;
                      }}
                      onPhraseSelectionComplete={handlePhraseSelectionComplete}
                    />
                  )}
                  onConfigurePanGesture={(g) => {
                    // "worklet";
                    // // require a deliberate horizontal swipe
                    // g.activeOffsetX([-40, 40]);

                    // // fail quickly when finger goes vertical (common during selection)
                    // g.failOffsetY([-8, 8]);

                    // CRITICAL: If a selection gesture ref exists, require it to fail first
                    if (selectionGestureRef.current) {
                      console.log("Ensuring page swipe waits for selection gesture to fail");
                      g.requireExternalGestureToFail(selectionGestureRef.current);
                    } else {
                      console.log("No selection gesture ref; skipping requireExternalGestureToFail");
                    }

                    g.activeOffsetX([-16, 16]).failOffsetY([-16, 16]);
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
            <View className="flex-row items-center justify-between px-5 py-3 border-t border-border/60 bg-panel/95">
              <Pressable
                onPress={handlePrevPage}
                disabled={!canGoPrev}
                className={cn(
                  'h-10 w-10 items-center justify-center rounded-full',
                  !canGoPrev ? 'opacity-20' : 'active:bg-muted/70'
                )}
              >
                <Ionicons name="chevron-back" size={22} color={colors['--ink']} />
              </Pressable>

              <Text className="text-xs font-sans-semibold text-subink tracking-[0.3em] uppercase">
                {currentPage + 1} / {totalPages || 1}
              </Text>

              <Pressable
                onPress={isLastPage ? handleFinishLesson : handleNextPage}
                disabled={!hasPages}
                className={cn(
                  'h-10 w-10 items-center justify-center rounded-full',
                  !hasPages
                    ? 'opacity-30'
                    : isLastPage
                      ? 'active:bg-successSoft'
                      : 'active:bg-muted/70'
                )}
              >
                <Ionicons
                  name={isLastPage ? 'checkmark' : 'chevron-forward'}
                  size={22}
                  color={isLastPage ? colors['--success'] : colors['--ink']}
                />
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {/* Word Details Panel */}
      {showInspector && selectedToken && selectedToken.normalized && (
        <View className={cn('absolute inset-0', isLargeScreen ? 'items-end' : 'justify-end')}>
          <Pressable
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.35)' }}
            onPress={() => {
              setIsInspectorOpen(false);
              setSelectedToken(null);
              setSelectedNormalized(null);
            }}
          />
          {isLargeScreen ? (
            <View
              className="bg-panel h-full border-l border-border/70"
              style={{ width: INSPECTOR_WIDTH }}
            >
              <WordDetails
                mode="sidebar"
                surface={selectedToken.surface}
                normalized={selectedToken.normalized}
                language={language}
                currentStatus={vocabMap[selectedToken.normalized] ?? 0}
                isUpdating={isUpdatingStatus}
                onUpdateStatus={handleUpdateStatus}
                onClose={() => {
                  setIsInspectorOpen(false);
                  setSelectedToken(null);
                  setSelectedNormalized(null);
                }}
              />
            </View>
          ) : (
            <WordDetails
              mode="popup"
              surface={selectedToken.surface}
              normalized={selectedToken.normalized}
              language={language}
              currentStatus={vocabMap[selectedToken.normalized] ?? 0}
              isUpdating={isUpdatingStatus}
              onUpdateStatus={handleUpdateStatus}
              onClose={() => {
                setIsInspectorOpen(false);
                setSelectedToken(null);
                setSelectedNormalized(null);
              }}
            />
          )}
        </View>
      )}

      {/* Phrase Translation Popup */}
      {showPhrasePopup && (
        <PhraseTranslationPopup
          selectedText={selectedPhraseText}
          language={language}
          selectionBounds={phraseSelectionBounds}
          onDismiss={handlePhraseDismiss}
        />
      )}
    </View>
  );
}

// (TextSelectionProviderBoundsCapture removed; selection now handled per page)
