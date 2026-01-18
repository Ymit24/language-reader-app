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

    if (existing) {
      await ctx.db.patch(existing._id, {
        status,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("vocab", {
        userId,
        language,
        term,
        display: term, // Initial display form is just the term
        status,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});
