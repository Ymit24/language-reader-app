import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Level thresholds and titles
const LEVELS = [
  { level: 1, xpRequired: 0, title: "Beginner" },
  { level: 2, xpRequired: 100, title: "Novice" },
  { level: 3, xpRequired: 300, title: "Learner" },
  { level: 4, xpRequired: 600, title: "Student" },
  { level: 5, xpRequired: 1000, title: "Scholar" },
  { level: 6, xpRequired: 1500, title: "Expert" },
  { level: 7, xpRequired: 2200, title: "Master" },
  { level: 8, xpRequired: 3000, title: "Sage" },
  { level: 9, xpRequired: 4000, title: "Virtuoso" },
  { level: 10, xpRequired: 5500, title: "Polyglot" },
  { level: 11, xpRequired: 7500, title: "Linguist" },
  { level: 12, xpRequired: 10000, title: "Wordsmith" },
  { level: 13, xpRequired: 13000, title: "Eloquent" },
  { level: 14, xpRequired: 17000, title: "Grandmaster" },
  { level: 15, xpRequired: 22000, title: "Legend" },
];

// XP rewards
const XP_REWARDS = {
  again: 1,
  hard: 5,
  good: 10,
  easy: 15,
  dailyBonus: 25,
  streakMultiplier: 0.2, // 20% bonus for 7+ day streak
};

export function getLevelFromXp(totalXp: number): {
  level: number;
  title: string;
  currentXp: number;
  xpForNextLevel: number;
  xpProgress: number;
} {
  let currentLevel = LEVELS[0];
  let nextLevel = LEVELS[1];

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVELS[i].xpRequired) {
      currentLevel = LEVELS[i];
      nextLevel = LEVELS[i + 1] || LEVELS[i];
      break;
    }
  }

  const xpIntoLevel = totalXp - currentLevel.xpRequired;
  const xpForNextLevel = nextLevel.xpRequired - currentLevel.xpRequired;
  const xpProgress =
    currentLevel.level === nextLevel.level
      ? 100
      : Math.round((xpIntoLevel / xpForNextLevel) * 100);

  return {
    level: currentLevel.level,
    title: currentLevel.title,
    currentXp: xpIntoLevel,
    xpForNextLevel,
    xpProgress,
  };
}

export function calculateXpForReview(
  quality: number,
  currentStreak: number,
  isFirstReviewOfDay: boolean
): { baseXp: number; bonusXp: number; totalXp: number } {
  let baseXp = 0;

  if (quality <= 1) baseXp = XP_REWARDS.again;
  else if (quality === 2) baseXp = XP_REWARDS.hard;
  else if (quality <= 4) baseXp = XP_REWARDS.good;
  else baseXp = XP_REWARDS.easy;

  let bonusXp = 0;

  // Daily bonus for first review of the day
  if (isFirstReviewOfDay) {
    bonusXp += XP_REWARDS.dailyBonus;
  }

  // Streak multiplier for 7+ day streaks
  if (currentStreak >= 7) {
    bonusXp += Math.round(baseXp * XP_REWARDS.streakMultiplier);
  }

  return {
    baseXp,
    bonusXp,
    totalXp: baseXp + bonusXp,
  };
}

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

export const getProgress = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const progress = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!progress) {
      // Return default state for new users
      return {
        totalXp: 0,
        level: 1,
        title: "Beginner",
        currentStreak: 0,
        longestStreak: 0,
        streakShields: 0,
        totalReviews: 0,
        totalCorrect: 0,
        xpProgress: 0,
        xpForNextLevel: 100,
        currentXpInLevel: 0,
      };
    }

    const levelInfo = getLevelFromXp(progress.totalXp);

    return {
      totalXp: progress.totalXp,
      level: levelInfo.level,
      title: levelInfo.title,
      currentStreak: progress.currentStreak,
      longestStreak: progress.longestStreak,
      streakShields: progress.streakShields,
      totalReviews: progress.totalReviews,
      totalCorrect: progress.totalCorrect,
      xpProgress: levelInfo.xpProgress,
      xpForNextLevel: levelInfo.xpForNextLevel,
      currentXpInLevel: levelInfo.currentXp,
    };
  },
});

export const getDailyStats = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const days = args.days ?? 90;
    const stats = await ctx.db
      .query("dailyStats")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .order("desc")
      .take(days);

    return stats.reverse();
  },
});

export const getTodayStats = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { reviewCount: 0, correctCount: 0, xpEarned: 0, minutesSpent: 0 };
    }

    const today = getTodayDateString();
    const stats = await ctx.db
      .query("dailyStats")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", userId).eq("date", today)
      )
      .first();

    if (!stats) {
      return { reviewCount: 0, correctCount: 0, xpEarned: 0, minutesSpent: 0 };
    }

    return {
      reviewCount: stats.reviewCount,
      correctCount: stats.correctCount,
      xpEarned: stats.xpEarned,
      minutesSpent: stats.minutesSpent,
    };
  },
});

export const getWeeklyStats = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { reviewCount: 0, correctCount: 0, xpEarned: 0, accuracy: 0 };
    }

    // Get last 7 days of stats
    const stats = await ctx.db
      .query("dailyStats")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .order("desc")
      .take(7);

    const totals = stats.reduce(
      (acc, day) => ({
        reviewCount: acc.reviewCount + day.reviewCount,
        correctCount: acc.correctCount + day.correctCount,
        xpEarned: acc.xpEarned + day.xpEarned,
      }),
      { reviewCount: 0, correctCount: 0, xpEarned: 0 }
    );

    return {
      ...totals,
      accuracy:
        totals.reviewCount > 0
          ? Math.round((totals.correctCount / totals.reviewCount) * 100)
          : 0,
    };
  },
});

export const recordReviewResult = mutation({
  args: {
    quality: v.number(),
    sessionStartTime: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();
    const today = getTodayDateString();

    // Get or create user progress
    let progress = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const isFirstReviewOfDay = progress?.lastReviewDate !== today;
    let currentStreak = progress?.currentStreak ?? 0;

    // Update streak logic
    if (isFirstReviewOfDay && progress) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (progress.lastReviewDate === yesterdayStr) {
        // Continuing streak
        currentStreak = progress.currentStreak + 1;
      } else if (progress.lastReviewDate !== today) {
        // Streak broken - check for shield
        if (progress.streakShields > 0) {
          // Use a shield to protect streak
          await ctx.db.patch(progress._id, {
            streakShields: progress.streakShields - 1,
          });
        } else {
          // Reset streak
          currentStreak = 1;
        }
      }
    } else if (!progress) {
      currentStreak = 1;
    }

    // Calculate XP
    const xpResult = calculateXpForReview(
      args.quality,
      currentStreak,
      isFirstReviewOfDay
    );

    const isCorrect = args.quality >= 3;

    if (progress) {
      const newTotalXp = progress.totalXp + xpResult.totalXp;
      const newLongestStreak = Math.max(progress.longestStreak, currentStreak);

      // Award streak shield every 30 days
      const shouldAwardShield =
        currentStreak > 0 && currentStreak % 30 === 0 && isFirstReviewOfDay;

      await ctx.db.patch(progress._id, {
        totalXp: newTotalXp,
        level: getLevelFromXp(newTotalXp).level,
        currentStreak,
        longestStreak: newLongestStreak,
        lastReviewDate: today,
        totalReviews: progress.totalReviews + 1,
        totalCorrect: progress.totalCorrect + (isCorrect ? 1 : 0),
        streakShields: shouldAwardShield
          ? progress.streakShields + 1
          : progress.streakShields,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("userProgress", {
        userId,
        totalXp: xpResult.totalXp,
        level: 1,
        currentStreak: 1,
        longestStreak: 1,
        lastReviewDate: today,
        streakShields: 0,
        totalReviews: 1,
        totalCorrect: isCorrect ? 1 : 0,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Update daily stats
    let dailyStats = await ctx.db
      .query("dailyStats")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", userId).eq("date", today)
      )
      .first();

    const sessionMinutes = Math.round((now - args.sessionStartTime) / 60000);

    if (dailyStats) {
      await ctx.db.patch(dailyStats._id, {
        reviewCount: dailyStats.reviewCount + 1,
        correctCount: dailyStats.correctCount + (isCorrect ? 1 : 0),
        xpEarned: dailyStats.xpEarned + xpResult.totalXp,
        minutesSpent: dailyStats.minutesSpent + sessionMinutes,
      });
    } else {
      await ctx.db.insert("dailyStats", {
        userId,
        date: today,
        reviewCount: 1,
        correctCount: isCorrect ? 1 : 0,
        xpEarned: xpResult.totalXp,
        minutesSpent: sessionMinutes,
      });
    }

    // Check for level up
    const oldLevel = progress ? getLevelFromXp(progress.totalXp).level : 0;
    const newTotalXp = (progress?.totalXp ?? 0) + xpResult.totalXp;
    const newLevelInfo = getLevelFromXp(newTotalXp);
    const leveledUp = newLevelInfo.level > oldLevel;

    return {
      xpEarned: xpResult.totalXp,
      baseXp: xpResult.baseXp,
      bonusXp: xpResult.bonusXp,
      leveledUp,
      newLevel: leveledUp ? newLevelInfo.level : null,
      newTitle: leveledUp ? newLevelInfo.title : null,
      currentStreak,
      isFirstReviewOfDay,
    };
  },
});

export const getLevelThresholds = query({
  handler: async () => {
    return LEVELS;
  },
});
