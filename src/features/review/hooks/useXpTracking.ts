import { useState, useCallback } from 'react';

interface UseXpTrackingReturn {
  totalXpEarned: number;
  correctCount: number;
  showXpPopup: boolean;
  lastXpEarned: number;
  lastBonusXp: number;
  leveledUp: boolean;
  newLevel: number | undefined;
  newTitle: string | undefined;
  currentStreak: number;
  updateXp: (xpData: {
    xpEarned: number;
    baseXp: number;
    bonusXp: number;
    currentStreak: number;
    leveledUp?: boolean;
    newLevel?: number;
    newTitle?: string;
  }) => void;
  incrementCorrect: () => void;
  hideXpPopup: () => void;
}

export function useXpTracking(): UseXpTrackingReturn {
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showXpPopup, setShowXpPopup] = useState(false);
  const [lastXpEarned, setLastXpEarned] = useState(0);
  const [lastBonusXp, setLastBonusXp] = useState(0);
  const [leveledUp, setLeveledUp] = useState(false);
  const [newLevel, setNewLevel] = useState<number | undefined>();
  const [newTitle, setNewTitle] = useState<string | undefined>();
  const [currentStreak, setCurrentStreak] = useState(0);

  const updateXp = useCallback((xpData: {
    xpEarned: number;
    baseXp: number;
    bonusXp: number;
    currentStreak: number;
    leveledUp?: boolean;
    newLevel?: number;
    newTitle?: string;
  }) => {
    setTotalXpEarned((prev) => prev + xpData.xpEarned);
    setLastXpEarned(xpData.baseXp);
    setLastBonusXp(xpData.bonusXp);
    setShowXpPopup(true);
    setCurrentStreak(xpData.currentStreak);

    if (xpData.leveledUp) {
      setLeveledUp(true);
      setNewLevel(xpData.newLevel);
      setNewTitle(xpData.newTitle);
    }
  }, []);

  const incrementCorrect = useCallback(() => {
    setCorrectCount((prev) => prev + 1);
  }, []);

  const hideXpPopup = useCallback(() => {
    setShowXpPopup(false);
  }, []);

  return {
    totalXpEarned,
    correctCount,
    showXpPopup,
    lastXpEarned,
    lastBonusXp,
    leveledUp,
    newLevel,
    newTitle,
    currentStreak,
    updateXp,
    incrementCorrect,
    hideXpPopup,
  };
}
