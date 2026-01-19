import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";

const STATUS_NEW = 0;
const STATUS_LEARNING_MIN = 1;
const STATUS_LEARNING_MAX = 3;
const STATUS_KNOWN = 4;
const STATUS_IGNORED = 99;

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
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { new: 0, learning: 0, known: 0, ignored: 0, total: 0 };
    }

    const vocab = await ctx.db
      .query("vocab")
      .withIndex("by_user_language_term", (q) =>
        q.eq("userId", userId).eq("language", args.language)
      )
      .collect();

    let newCount = 0;
    let learningCount = 0;
    let knownCount = 0;
    let ignoredCount = 0;

    for (const v of vocab) {
      if (v.status === STATUS_NEW) newCount++;
      else if (v.status >= STATUS_LEARNING_MIN && v.status <= STATUS_LEARNING_MAX) learningCount++;
      else if (v.status === STATUS_KNOWN) knownCount++;
      else if (v.status === STATUS_IGNORED) ignoredCount++;
    }

    return {
      new: newCount,
      learning: learningCount,
      known: knownCount,
      ignored: ignoredCount,
      total: vocab.length,
    };
  },
});

type SortBy = 'dateAdded' | 'alphabetical' | 'nextReview' | 'status';

function sortVocab<T extends { createdAt: number; term: string; status: number; nextReviewAt?: number | undefined }>(
  vocab: T[],
  sortBy: SortBy,
  sortOrder: 'asc' | 'desc'
): T[] {
  const sorted = [...vocab].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'dateAdded':
        comparison = a.createdAt - b.createdAt;
        break;
      case 'alphabetical':
        comparison = a.term.localeCompare(b.term);
        break;
      case 'status':
        comparison = a.status - b.status;
        break;
      case 'nextReview':
        if (a.nextReviewAt === undefined && b.nextReviewAt === undefined) comparison = 0;
        else if (a.nextReviewAt === undefined) comparison = 1;
        else if (b.nextReviewAt === undefined) comparison = -1;
        else comparison = a.nextReviewAt - b.nextReviewAt;
        break;
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });

  return sorted;
}

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

    let paginatedResult = await ctx.db
      .query("vocab")
      .withIndex("by_user_language_term", (q) =>
        q.eq("userId", userId).eq("language", args.language)
      )
      .paginate(args.paginationOpts);

    let vocab = paginatedResult.page;

    if (args.search && args.search.trim().length > 0) {
      const searchLower = args.search.toLowerCase().trim();
      vocab = vocab.filter(v =>
        v.term.toLowerCase().includes(searchLower) ||
        (v.display && v.display.toLowerCase().includes(searchLower))
      );
    }

    if (args.statusFilter && args.statusFilter.length > 0) {
      vocab = vocab.filter(v => args.statusFilter!.includes(v.status));
    } else {
      vocab = vocab.filter(v => v.status !== STATUS_IGNORED);
    }

    const sortBy = (args.sortBy as SortBy) || 'dateAdded';
    const sortOrder = args.sortOrder || 'desc';
    vocab = sortVocab(vocab, sortBy, sortOrder);

    return { page: vocab, continueCursor: paginatedResult.continueCursor, isDone: paginatedResult.isDone };
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
