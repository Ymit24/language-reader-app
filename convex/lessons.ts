import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { tokenize } from "./lib/tokenize";

export const listLessons = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Fetch lessons for the user
    // Ordered by lastOpenedAt desc (most recent), then createdAt desc
    // Convex doesn't support multi-field sort easily in one go unless indexed that way.
    // Index: "by_user_lastOpenedAt" ["userId", "lastOpenedAt"]
    
    // We'll prioritize the "Recently Opened" view
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_user_lastOpenedAt", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return lessons;
  },
});

export const createLesson = mutation({
  args: {
    title: v.string(),
    language: v.union(v.literal("de"), v.literal("fr"), v.literal("ja")),
    rawText: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const { title, language, rawText } = args;

    // 1. Tokenize
    const tokens = tokenize(rawText);

    // 2. Calculate counts
    const wordTokens = tokens.filter((t) => t.isWord);
    const tokenCount = wordTokens.length;
    // For MVP, we don't have existing vocab knowledge check during import yet,
    // so knownTokenCount starts at 0.
    const knownTokenCount = 0;

    const now = Date.now();

    // 3. Create Lesson
    const lessonId = await ctx.db.insert("lessons", {
      userId,
      language,
      title,
      source: "paste",
      rawText,
      lastOpenedAt: now,
      tokenCount,
      knownTokenCount,
      createdAt: now,
      updatedAt: now,
    });

    // 4. Batch insert tokens
    // We'll use Promise.all for speed, though Convex handles them sequentially in the transaction.
    await Promise.all(
      tokens.map((token, index) =>
        ctx.db.insert("lessonTokens", {
          userId,
          lessonId,
          language,
          index,
          surface: token.surface,
          normalized: token.normalized,
          isWord: token.isWord,
          createdAt: now,
        })
      )
    );

    return lessonId;
  },
});

export const deleteLesson = mutation({
  args: {
    lessonId: v.id("lessons"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const { lessonId } = args;

    // Verify ownership
    const lesson = await ctx.db.get(lessonId);
    if (!lesson || lesson.userId !== userId) {
      throw new Error("Lesson not found or unauthorized");
    }

    // Delete lesson tokens
    const tokens = await ctx.db
      .query("lessonTokens")
      .withIndex("by_lesson_index", (q) => q.eq("lessonId", lessonId))
      .collect();

    await Promise.all(tokens.map((t) => ctx.db.delete(t._id)));

    // Delete the lesson
    await ctx.db.delete(lessonId);
  },
});

export const updateLesson = mutation({
  args: {
    lessonId: v.id("lessons"),
    title: v.string(),
    language: v.union(v.literal("de"), v.literal("fr"), v.literal("ja")),
    rawText: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const { lessonId, title, language, rawText } = args;

    // Verify ownership
    const lesson = await ctx.db.get(lessonId);
    if (!lesson || lesson.userId !== userId) {
      throw new Error("Lesson not found or unauthorized");
    }

    // Tokenize new text
    const tokens = tokenize(rawText);

    // Calculate counts
    const wordTokens = tokens.filter((t) => t.isWord);
    const tokenCount = wordTokens.length;
    // Reset knownTokenCount on edit since we're retokenizing
    const knownTokenCount = 0;

    const now = Date.now();

    // Delete existing tokens
    const existingTokens = await ctx.db
      .query("lessonTokens")
      .withIndex("by_lesson_index", (q) => q.eq("lessonId", lessonId))
      .collect();

    await Promise.all(existingTokens.map((t) => ctx.db.delete(t._id)));

    // Batch insert new tokens
    await Promise.all(
      tokens.map((token, index) =>
        ctx.db.insert("lessonTokens", {
          userId,
          lessonId,
          language,
          index,
          surface: token.surface,
          normalized: token.normalized,
          isWord: token.isWord,
          createdAt: now,
        })
      )
    );

    // Update lesson
    await ctx.db.patch(lessonId, {
      title,
      language,
      rawText,
      tokenCount,
      knownTokenCount,
      updatedAt: now,
    });
  },
});

export const updateLessonProgress = mutation({
  args: {
    lessonId: v.id("lessons"),
    currentPage: v.optional(v.number()),
    lastTokenIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const { lessonId } = args;

    const lesson = await ctx.db.get(lessonId);
    if (!lesson || lesson.userId !== userId) {
      throw new Error("Lesson not found or unauthorized");
    }

    const now = Date.now();
    const updates: Record<string, any> = {
      lastOpenedAt: now,
      updatedAt: now,
    };

    if (args.currentPage !== undefined) {
      updates.currentPage = args.currentPage;
    }
    if (args.lastTokenIndex !== undefined) {
      updates.lastTokenIndex = args.lastTokenIndex;
    }

    await ctx.db.patch(lessonId, updates);
  },
});

export const getLesson = query({
  args: {
    lessonId: v.id("lessons"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const { lessonId } = args;
    const lesson = await ctx.db.get(lessonId);

    if (!lesson || lesson.userId !== userId) {
      return null;
    }

    // Fetch all tokens for the lesson
    // Optimization: In a real app with huge texts, we might paginate tokens.
    // For MVP, we fetch all.
    const tokens = await ctx.db
      .query("lessonTokens")
      .withIndex("by_lesson_index", (q) => q.eq("lessonId", lessonId))
      .collect();

    return {
      ...lesson,
      tokens,
    };
  },
});

export const listLessonsWithVocab = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_user_lastOpenedAt", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    const result = await Promise.all(
      lessons.map(async (lesson) => {
        const tokens = await ctx.db
          .query("lessonTokens")
          .withIndex("by_lesson_index", (q) => q.eq("lessonId", lesson._id))
          .collect();

        const uniqueTerms = new Set<string>();
        for (const token of tokens) {
          if (token.isWord && token.normalized) {
            uniqueTerms.add(token.normalized);
          }
        }

        return {
          ...lesson,
          uniqueTerms: Array.from(uniqueTerms),
        };
      })
    );

    return result;
  },
});

export const completeLesson = mutation({
  args: {
    lessonId: v.id("lessons"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const { lessonId } = args;

    const lesson = await ctx.db.get(lessonId);
    if (!lesson || lesson.userId !== userId) {
      throw new Error("Lesson not found or unauthorized");
    }

    await ctx.db.patch(lessonId, {
      completedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
