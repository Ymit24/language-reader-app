import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";

const STATUS_NEW = 0;
const STATUS_LEARNING_MIN = 1;
const STATUS_LEARNING_MAX = 3;
const STATUS_KNOWN = 4;

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

export const getVocabCounts = query({
  args: {
    language: v.union(v.literal("de"), v.literal("fr"), v.literal("ja")),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { new: 0, recognized: 0, learning: 0, familiar: 0, known: 0, total: 0 };
    }

    const vocab = await ctx.db
      .query("vocab")
      .withIndex("by_user_language_term", (q) =>
        q.eq("userId", userId).eq("language", args.language)
      )
      .collect();

    let newCount = 0;
    let recognizedCount = 0;
    let learningCount = 0;
    let familiarCount = 0;
    let knownCount = 0;
    let total = 0;

    const searchLower = args.search?.toLowerCase().trim();

    for (const v of vocab) {
      if (searchLower && !v.term.toLowerCase().includes(searchLower) && !(v.display && v.display.toLowerCase().includes(searchLower))) {
        continue;
      }

      total++;

      if (v.status === STATUS_NEW) newCount++;
      else if (v.status === STATUS_LEARNING_MIN) recognizedCount++;
      else if (v.status === STATUS_LEARNING_MIN + 1) learningCount++;
      else if (v.status === STATUS_LEARNING_MAX) familiarCount++;
      else if (v.status === STATUS_KNOWN) knownCount++;
    }

    return {
      new: newCount,
      recognized: recognizedCount,
      learning: learningCount,
      familiar: familiarCount,
      known: knownCount,
      total: total,
    };
  },
});

type SortBy = 'dateAdded' | 'alphabetical' | 'status';

export const listVocab = query({
  args: {
    language: v.union(v.literal("de"), v.literal("fr"), v.literal("ja")),
    search: v.optional(v.string()),
    statusFilter: v.optional(v.array(v.number())),
    sortBy: v.optional(v.string()),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { page: [], continueCursor: "", isDone: true };
    }

    const sortBy = (args.sortBy as SortBy) || "dateAdded";
    const sortOrder = args.sortOrder || "desc";

    let query;

    // Select index based on sort
    if (sortBy === "alphabetical") {
      query = ctx.db.query("vocab").withIndex("by_user_language_term", (q) =>
        q.eq("userId", userId).eq("language", args.language)
      );
    } else if (sortBy === "status") {
      query = ctx.db.query("vocab").withIndex("by_user_language_status", (q) =>
        q.eq("userId", userId).eq("language", args.language)
      );
    } else {
      // Default to dateAdded
      query = ctx.db.query("vocab").withIndex("by_user_language_createdAt", (q) =>
        q.eq("userId", userId).eq("language", args.language)
      );
    }

    // Apply sort order
    const orderedQuery = sortOrder === "desc" ? query.order("desc") : query.order("asc");

    const paginatedResult = await orderedQuery.paginate(args.paginationOpts);

    let vocab = paginatedResult.page;

    if (args.search && args.search.trim().length > 0) {
      const searchLower = args.search.toLowerCase().trim();
      vocab = vocab.filter(
        (v) =>
          v.term.toLowerCase().includes(searchLower) ||
          (v.display && v.display.toLowerCase().includes(searchLower))
      );
    }

    if (args.statusFilter && args.statusFilter.length > 0) {
      vocab = vocab.filter((v) => args.statusFilter!.includes(v.status));
    }

    return {
      page: vocab,
      continueCursor: paginatedResult.continueCursor,
      isDone: paginatedResult.isDone,
    };
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
    const knownStatus = STATUS_KNOWN;

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

      const currentStatus = existing?.status ?? STATUS_NEW;
      if (currentStatus === STATUS_NEW || (currentStatus >= STATUS_LEARNING_MIN && currentStatus <= STATUS_LEARNING_MAX)) {
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

export const bulkUpdateStatus = mutation({
  args: {
    language: v.union(v.literal("de"), v.literal("fr"), v.literal("ja")),
    terms: v.array(v.string()),
    status: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();
    const isLearningStatus = args.status >= STATUS_LEARNING_MIN && args.status <= STATUS_LEARNING_MAX;

    for (const term of args.terms) {
      const existing = await ctx.db
        .query("vocab")
        .withIndex("by_user_language_term", (q) =>
          q
            .eq("userId", userId)
            .eq("language", args.language)
            .eq("term", term)
        )
        .first();

      if (existing) {
        const updateFields: Record<string, any> = {
          status: args.status,
          updatedAt: now,
        };

        if (isLearningStatus) {
          updateFields.nextReviewAt = now;
          updateFields.intervalDays = 0;
          updateFields.reviews = 0;
        }

        await ctx.db.patch(existing._id, updateFields);
      } else {
        await ctx.db.insert("vocab", {
          userId,
          language: args.language,
          term,
          display: term,
          status: args.status,
          createdAt: now,
          updatedAt: now,
          ...(isLearningStatus && {
            nextReviewAt: now,
            intervalDays: 0,
            reviews: 0,
          }),
        });
      }
    }
  },
});

export const updateVocabMeta = mutation({
  args: {
    termId: v.id("vocab"),
    meaning: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const existing = await ctx.db.get(args.termId);
    if (!existing || existing.userId !== userId) {
      throw new Error("Vocab entry not found or unauthorized");
    }

    const updateFields: Record<string, any> = {
      updatedAt: Date.now(),
    };

    if (args.meaning !== undefined) {
      updateFields.meaning = args.meaning;
    }

    if (args.notes !== undefined) {
      updateFields.notes = args.notes;
    }

    await ctx.db.patch(args.termId, updateFields);
  },
});

export const deleteVocab = mutation({
  args: { termId: v.id("vocab") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const existing = await ctx.db.get(args.termId);
    if (!existing || existing.userId !== userId) {
      throw new Error("Vocab entry not found or unauthorized");
    }

    await ctx.db.delete(args.termId);
  },
});

/**
 * Migration: Converts all 'ignored' (status 99) words to 'new' (status 0).
 * This can be run once to clean up the database.
 */
export const migrateIgnoredToNew = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const ignoredWords = await ctx.db
      .query("vocab")
      .withIndex("by_user_language_status", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), 99))
      .collect();

    for (const word of ignoredWords) {
      await ctx.db.patch(word._id, {
        status: 0,
        updatedAt: Date.now(),
      });
    }

    return ignoredWords.length;
  },
});
