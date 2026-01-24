import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { calculateXpForReview, getLevelFromXp } from "./progress";

export const getDueCount = query({
  args: {
    language: v.union(v.literal("de"), v.literal("fr"), v.literal("ja")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return 0;
    }

    const now = Date.now();

    const items = await ctx.db
      .query("vocab")
      .withIndex("by_user_language_nextReviewAt", (q) =>
        q
          .eq("userId", userId)
          .eq("language", args.language)
          .lte("nextReviewAt", now)
      )
      .collect();

    return items.length;
  },
});

export const getKnownCount = query({
  args: {
    language: v.union(v.literal("de"), v.literal("fr"), v.literal("ja")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return 0;
    }

    const items = await ctx.db
      .query("vocab")
      .withIndex("by_user_language_status", (q) =>
        q.eq("userId", userId).eq("language", args.language).eq("status", 4)
      )
      .collect();

    return items.length;
  },
});

export const getTodayReviewCount = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return 0;
    }

    const now = Date.now();
    let totalDue = 0;

    const languages: Array<'de' | 'fr' | 'ja'> = ['de', 'fr', 'ja'];

    for (const language of languages) {
      const items = await ctx.db
        .query("vocab")
        .withIndex("by_user_language_nextReviewAt", (q) =>
          q.eq("userId", userId).eq("language", language).lte("nextReviewAt", now)
        )
        .collect();
      totalDue += items.length;
    }

    return totalDue;
  },
});

export const getLearningCount = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return 0;
    }

    let totalLearning = 0;
    const languages: Array<'de' | 'fr' | 'ja'> = ['de', 'fr', 'ja'];

    for (const language of languages) {
      for (let status = 1; status <= 3; status++) {
        const items = await ctx.db
          .query("vocab")
          .withIndex("by_user_language_status", (q) =>
            q.eq("userId", userId).eq("language", language).eq("status", status)
          )
          .collect();
        totalLearning += items.length;
      }
    }

    return totalLearning;
  },
});

interface Sm2Result {
  intervalDays: number;
  ease: number;
  reviews: number;
}

function calculateSm2(
  current: { intervalDays?: number; ease?: number; reviews?: number } | null,
  quality: number
): Sm2Result {
  const previousReviews = current?.reviews ?? 0;
  const previousInterval = current?.intervalDays ?? 0;
  const previousEase = current?.ease ?? 2.5;

  let newEase = previousEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEase = Math.max(1.3, newEase);

  let newInterval: number;
  const newReviews = previousReviews + 1;

  if (quality < 3) {
    newInterval = 1;
  } else {
    if (newReviews === 1) {
      newInterval = 1;
    } else if (newReviews === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(previousInterval * newEase);
    }
  }

  return {
    intervalDays: newInterval,
    ease: newEase,
    reviews: newReviews,
  };
}

export const startReviewSession = mutation({
  args: {
    language: v.union(v.literal("de"), v.literal("fr"), v.literal("ja")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const limit = args.limit ?? 20;
    const now = Date.now();

    const dueVocab = await ctx.db
      .query("vocab")
      .withIndex("by_user_language_nextReviewAt", (q) =>
        q
          .eq("userId", userId)
          .eq("language", args.language)
          .lte("nextReviewAt", now)
      )
      .take(limit);

    if (dueVocab.length === 0) {
      return { sessionId: null, items: [] };
    }

    const sessionId = await ctx.db.insert("reviewSessions", {
      userId,
      language: args.language,
      status: "in_progress",
      cardCount: dueVocab.length,
      reviewedCount: 0,
      easeSum: 0,
      startedAt: now,
    });

    const sessionItems = await Promise.all(
      dueVocab.map((vocab) =>
        ctx.db.insert("reviewSessionItems", {
          sessionId,
          vocabId: vocab._id,
        })
      )
    );

    const itemsWithVocab = dueVocab.map((vocab, i) => ({
      _id: sessionItems[i],
      sessionId,
      vocabId: vocab._id,
      quality: undefined as number | undefined,
      reviewedAt: undefined as number | undefined,
      vocab,
    }));

    return { sessionId, items: itemsWithVocab };
  },
});

export const getSession = query({
  args: {
    sessionId: v.id("reviewSessions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId) {
      throw new Error("Session not found");
    }

    const items = await ctx.db
      .query("reviewSessionItems")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    const itemsWithVocab = await Promise.all(
      items.map(async (item) => {
        const vocab = await ctx.db.get(item.vocabId);
        return {
          ...item,
          vocab: vocab!,
        };
      })
    );

    return {
      session,
      items: itemsWithVocab,
    };
  },
});

export const gradeCard = mutation({
  args: {
    sessionItemId: v.id("reviewSessionItems"),
    quality: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const sessionItem = await ctx.db.get(args.sessionItemId);
    if (!sessionItem) {
      throw new Error("Session item not found");
    }

    const session = await ctx.db.get(sessionItem.sessionId);
    if (!session || session.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const vocab = await ctx.db.get(sessionItem.vocabId);
    if (!vocab || vocab.userId !== userId) {
      throw new Error("Vocab not found");
    }

    const now = Date.now();
    const sm2Result = calculateSm2(vocab, args.quality);

    const msPerDay = 24 * 60 * 60 * 1000;
    const nextReviewAt = now + sm2Result.intervalDays * msPerDay;

    await ctx.db.patch(sessionItem.vocabId, {
      intervalDays: sm2Result.intervalDays,
      ease: sm2Result.ease,
      reviews: sm2Result.reviews,
      lastReviewedAt: now,
      nextReviewAt,
      updatedAt: now,
    });

    await ctx.db.patch(args.sessionItemId, {
      quality: args.quality,
      reviewedAt: now,
    });

    const newReviewedCount = session.reviewedCount + 1;
    const newEaseSum = session.easeSum + sm2Result.ease;

    if (newReviewedCount >= session.cardCount) {
      await ctx.db.patch(session._id, {
        status: "completed",
        reviewedCount: newReviewedCount,
        easeSum: newEaseSum,
        completedAt: now,
      });
    } else {
      await ctx.db.patch(session._id, {
        reviewedCount: newReviewedCount,
        easeSum: newEaseSum,
      });
    }

    return {
      ease: sm2Result.ease,
      isComplete: newReviewedCount >= session.cardCount,
    };
  },
});

export const abandonSession = mutation({
  args: {
    sessionId: v.id("reviewSessions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId) {
      throw new Error("Session not found");
    }

    if (session.status !== "in_progress") {
      return;
    }

    await ctx.db.patch(args.sessionId, {
      status: "abandoned",
    });
  },
});

// Get all language stats at once for the dashboard
export const getAllLanguageStats = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const now = Date.now();
    const languages: Array<'de' | 'fr' | 'ja'> = ['de', 'fr', 'ja'];
    const languageNames: Record<string, string> = {
      de: 'German',
      fr: 'French',
      ja: 'Japanese',
    };

    const stats = await Promise.all(
      languages.map(async (language) => {
        // Get due count
        const dueItems = await ctx.db
          .query("vocab")
          .withIndex("by_user_language_nextReviewAt", (q) =>
            q
              .eq("userId", userId)
              .eq("language", language)
              .lte("nextReviewAt", now)
          )
          .collect();

        // Get learning count (status 1-3)
        let learningCount = 0;
        for (let status = 1; status <= 3; status++) {
          const items = await ctx.db
            .query("vocab")
            .withIndex("by_user_language_status", (q) =>
              q.eq("userId", userId).eq("language", language).eq("status", status)
            )
            .collect();
          learningCount += items.length;
        }

        // Get known count (status 4)
        const knownItems = await ctx.db
          .query("vocab")
          .withIndex("by_user_language_status", (q) =>
            q.eq("userId", userId).eq("language", language).eq("status", 4)
          )
          .collect();

        return {
          language,
          languageName: languageNames[language],
          dueCount: dueItems.length,
          learningCount,
          knownCount: knownItems.length,
          totalCount: learningCount + knownItems.length,
        };
      })
    );

    // Only return languages with some vocab
    return stats.filter((s) => s.totalCount > 0 || s.dueCount > 0);
  },
});

// Enhanced gradeCard that also handles XP
export const gradeCardWithXp = mutation({
  args: {
    sessionItemId: v.id("reviewSessionItems"),
    quality: v.number(),
    sessionStartTime: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const sessionItem = await ctx.db.get(args.sessionItemId);
    if (!sessionItem) {
      throw new Error("Session item not found");
    }

    const session = await ctx.db.get(sessionItem.sessionId);
    if (!session || session.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const vocab = await ctx.db.get(sessionItem.vocabId);
    if (!vocab || vocab.userId !== userId) {
      throw new Error("Vocab not found");
    }

    const now = Date.now();
    const today = new Date().toISOString().split("T")[0];
    const sm2Result = calculateSm2(vocab, args.quality);

    const msPerDay = 24 * 60 * 60 * 1000;
    const nextReviewAt = now + sm2Result.intervalDays * msPerDay;

    // Update vocab with SRS data
    await ctx.db.patch(sessionItem.vocabId, {
      intervalDays: sm2Result.intervalDays,
      ease: sm2Result.ease,
      reviews: sm2Result.reviews,
      lastReviewedAt: now,
      nextReviewAt,
      updatedAt: now,
    });

    // Update session item
    await ctx.db.patch(args.sessionItemId, {
      quality: args.quality,
      reviewedAt: now,
    });

    // Get or create user progress for XP calculation
    let progress = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const isFirstReviewOfDay = progress?.lastReviewDate !== today;
    let currentStreak = progress?.currentStreak ?? 0;

    // Streak logic
    if (isFirstReviewOfDay && progress) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (progress.lastReviewDate === yesterdayStr) {
        currentStreak = progress.currentStreak + 1;
      } else if (progress.lastReviewDate !== today) {
        if (progress.streakShields > 0) {
          await ctx.db.patch(progress._id, {
            streakShields: progress.streakShields - 1,
          });
        } else {
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

    // Update or create user progress
    if (progress) {
      const newTotalXp = progress.totalXp + xpResult.totalXp;
      const newLongestStreak = Math.max(progress.longestStreak, currentStreak);
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

    if (dailyStats) {
      await ctx.db.patch(dailyStats._id, {
        reviewCount: dailyStats.reviewCount + 1,
        correctCount: dailyStats.correctCount + (isCorrect ? 1 : 0),
        xpEarned: dailyStats.xpEarned + xpResult.totalXp,
      });
    } else {
      await ctx.db.insert("dailyStats", {
        userId,
        date: today,
        reviewCount: 1,
        correctCount: isCorrect ? 1 : 0,
        xpEarned: xpResult.totalXp,
        minutesSpent: 0,
      });
    }

    // Update session counts
    const newReviewedCount = session.reviewedCount + 1;
    const newEaseSum = session.easeSum + sm2Result.ease;

    if (newReviewedCount >= session.cardCount) {
      await ctx.db.patch(session._id, {
        status: "completed",
        reviewedCount: newReviewedCount,
        easeSum: newEaseSum,
        completedAt: now,
      });
    } else {
      await ctx.db.patch(session._id, {
        reviewedCount: newReviewedCount,
        easeSum: newEaseSum,
      });
    }

    // Check for level up
    const oldLevel = progress ? getLevelFromXp(progress.totalXp).level : 0;
    const newTotalXp = (progress?.totalXp ?? 0) + xpResult.totalXp;
    const newLevelInfo = getLevelFromXp(newTotalXp);
    const leveledUp = newLevelInfo.level > oldLevel;

    return {
      ease: sm2Result.ease,
      isComplete: newReviewedCount >= session.cardCount,
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
