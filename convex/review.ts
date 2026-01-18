import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

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

export const getDueVocab = query({
  args: {
    language: v.union(v.literal("de"), v.literal("fr"), v.literal("ja")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const limit = args.limit ?? 20;
    const now = Date.now();

    const items = await ctx.db
      .query("vocab")
      .withIndex("by_user_language_nextReviewAt", (q) =>
        q
          .eq("userId", userId)
          .eq("language", args.language)
          .lte("nextReviewAt", now)
      )
      .take(limit);

    return items;
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

export const processReview = mutation({
  args: {
    vocabId: v.id("vocab"),
    quality: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const vocab = await ctx.db.get(args.vocabId);
    if (!vocab || vocab.userId !== userId) {
      throw new Error("Vocab not found or unauthorized");
    }

    const now = Date.now();
    const result = calculateSm2(vocab, args.quality);

    const msPerDay = 24 * 60 * 60 * 1000;
    const nextReviewAt = now + result.intervalDays * msPerDay;

    await ctx.db.patch(args.vocabId, {
      intervalDays: result.intervalDays,
      ease: result.ease,
      reviews: result.reviews,
      lastReviewedAt: now,
      nextReviewAt,
      updatedAt: now,
    });

    return {
      intervalDays: result.intervalDays,
      ease: result.ease,
      reviews: result.reviews,
    };
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
