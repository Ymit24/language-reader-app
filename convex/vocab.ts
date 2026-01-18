import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getVocabProfile = query({
  args: {
    language: v.union(v.literal("de"), v.literal("fr"), v.literal("ja")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const vocab = await ctx.db
      .query("vocab")
      .withIndex("by_user_language_term", (q) =>
        q.eq("userId", userId).eq("language", args.language)
      )
      .collect();

    return vocab;
  },
});

export const updateVocabStatus = mutation({
  args: {
    language: v.union(v.literal("de"), v.literal("fr"), v.literal("ja")),
    term: v.string(),
    status: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const { language, term, status } = args;

    const existing = await ctx.db
      .query("vocab")
      .withIndex("by_user_language_term", (q) =>
        q
          .eq("userId", userId)
          .eq("language", language)
          .eq("term", term)
      )
      .first();

    const now = Date.now();

    const isLearningStatus = status >= 1 && status <= 3;
    const updateFields: Record<string, any> = {
      status,
      updatedAt: now,
    };

    if (isLearningStatus) {
      updateFields.nextReviewAt = now;
      updateFields.intervalDays = 0;
      updateFields.reviews = 0;
    }

    if (existing) {
      await ctx.db.patch(existing._id, updateFields);
    } else {
      await ctx.db.insert("vocab", {
        userId,
        language,
        term,
        display: term,
        status,
        createdAt: now,
        updatedAt: now,
        ...(isLearningStatus && {
          nextReviewAt: now,
          intervalDays: 0,
          reviews: 0,
        }),
      });
    }
  },
});

export const markWordsAsKnown = mutation({
  args: {
    lessonId: v.id("lessons"),
    wordTerms: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const { lessonId, wordTerms } = args;

    const lesson = await ctx.db.get(lessonId);
    if (!lesson || lesson.userId !== userId) {
      throw new Error("Lesson not found or unauthorized");
    }

    const now = Date.now();
    const knownStatus = 4;

    for (const term of wordTerms) {
      const existing = await ctx.db
        .query("vocab")
        .withIndex("by_user_language_term", (q) =>
          q
            .eq("userId", userId)
            .eq("language", lesson.language)
            .eq("term", term)
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          status: knownStatus,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("vocab", {
          userId,
          language: lesson.language,
          term,
          display: term,
          status: knownStatus,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  },
});

export const markRemainingWordsAsKnown = mutation({
  args: {
    lessonId: v.id("lessons"),
    keepUnknownTerms: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const { lessonId, keepUnknownTerms } = args;

    const lesson = await ctx.db.get(lessonId);
    if (!lesson || lesson.userId !== userId) {
      throw new Error("Lesson not found or unauthorized");
    }

    const keepSet = new Set(keepUnknownTerms);
    const now = Date.now();
    const knownStatus = 4;

    const tokens = await ctx.db
      .query("lessonTokens")
      .withIndex("by_lesson_index", (q) => q.eq("lessonId", lessonId))
      .collect();

    const uniqueUnknownTerms = new Map<string, string>();
    for (const token of tokens) {
      if (token.isWord && token.normalized && !keepSet.has(token.normalized)) {
        if (!uniqueUnknownTerms.has(token.normalized)) {
          uniqueUnknownTerms.set(token.normalized, token.surface);
        }
      }
    }

    for (const term of uniqueUnknownTerms.keys()) {
      const existing = await ctx.db
        .query("vocab")
        .withIndex("by_user_language_term", (q) =>
          q
            .eq("userId", userId)
            .eq("language", lesson.language)
            .eq("term", term)
        )
        .first();

      const currentStatus = existing?.status ?? 0;
      if (currentStatus === 0 || (currentStatus >= 1 && currentStatus <= 3)) {
        if (existing) {
          await ctx.db.patch(existing._id, {
            status: knownStatus,
            updatedAt: now,
          });
        } else {
          await ctx.db.insert("vocab", {
            userId,
            language: lesson.language,
            term,
            display: uniqueUnknownTerms.get(term) ?? term,
            status: knownStatus,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }
  },
});
