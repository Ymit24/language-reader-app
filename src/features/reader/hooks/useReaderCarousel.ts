import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { ICarouselInstance } from 'react-native-reanimated-carousel';

const SIDEBAR_EXPANDED_WIDTH = 256;
const READER_MAX_WIDTH = 1040;

interface UseReaderCarouselOptions {
  initialPage?: number;
  totalPages: number;
}

export function useReaderCarousel({
  initialPage = 0,
  totalPages,
}: UseReaderCarouselOptions) {
  const { width, height: windowHeight } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const carouselRef = useRef<ICarouselInstance>(null);
  const hasSetInitialPage = useRef(false);
  const layoutUpdateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fallbackCarouselHeight = useMemo(() => {
    // Leave room for the app header + reader card padding + the in-card footer.
    // Keep a sane minimum so the carousel mounts on first layout.
    return Math.max(windowHeight - 320, 260);
  }, [windowHeight]);

  const readerFrameWidth = useMemo(() => {
    const horizontalPadding = 32;
    const reservedSidebar = isLargeScreen ? SIDEBAR_EXPANDED_WIDTH : 0;
    const availableWidth = Math.max(
      width - reservedSidebar - horizontalPadding,
      0
    );
    if (!isLargeScreen) {
      return availableWidth;
    }
    return Math.min(availableWidth, READER_MAX_WIDTH);
  }, [isLargeScreen, width]);

  const [carouselLayout, setCarouselLayout] = useState({
    width: readerFrameWidth,
    height: fallbackCarouselHeight,
  });

  const [currentPage, setCurrentPage] = useState(
    () => Math.max(0, initialPage)
  );

  const carouselWidth = readerFrameWidth;
  const carouselHeight =
    carouselLayout.height > 0 ? carouselLayout.height : fallbackCarouselHeight;

  const handleLayoutChange = useCallback(
    (layoutHeight: number) => {
      if (layoutHeight === 0 || layoutHeight === carouselLayout.height) return;

      if (layoutUpdateTimer.current) {
        clearTimeout(layoutUpdateTimer.current);
      }
      layoutUpdateTimer.current = setTimeout(() => {
        setCarouselLayout({ width: readerFrameWidth, height: layoutHeight });
      }, 80);
    },
    [readerFrameWidth, carouselLayout.height]
  );

  const goToPage = useCallback((pageIndex: number) => {
    carouselRef.current?.scrollTo({ index: pageIndex, animated: false });
  }, []);

  const nextPage = useCallback(() => {
    carouselRef.current?.scrollTo({ count: 1, animated: true });
  }, []);

  const prevPage = useCallback(() => {
    carouselRef.current?.scrollTo({ count: -1, animated: true });
  }, []);

  // Initialize carousel to the starting page
  useEffect(() => {
    if (totalPages === 0) return;
    if (hasSetInitialPage.current) return;
    if (carouselLayout.width === 0 || carouselLayout.height === 0) return;

    const pageToSet = Math.min(Math.max(initialPage, 0), totalPages - 1);

    hasSetInitialPage.current = true;
    setCurrentPage(pageToSet);
    goToPage(pageToSet);
  }, [carouselLayout.height, carouselLayout.width, initialPage, totalPages, goToPage]);

  // Update carousel width when frame width changes
  useEffect(() => {
    setCarouselLayout((prev) => {
      if (prev.width === readerFrameWidth) return prev;
      return { ...prev, width: readerFrameWidth };
    });
  }, [readerFrameWidth]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (layoutUpdateTimer.current) {
        clearTimeout(layoutUpdateTimer.current);
      }
    };
  }, []);

  return {
    carouselRef,
    carouselWidth,
    carouselHeight,
    readerFrameWidth,
    currentPage,
    setCurrentPage,
    isLargeScreen,
    handleLayoutChange,
    goToPage,
    nextPage,
    prevPage,
  };
}
