import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  userLanguages: defineTable({
    userId: v.string(),
    language: v.union(v.literal("de"), v.literal("fr"), v.literal("ja")),
    fontSize: v.number(),
    lineHeight: v.number(),
    showKnownStyling: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_language", ["userId", "language"])
    .index("by_userId", ["userId"]),

  lessons: defineTable({
    userId: v.string(),
    language: v.union(v.literal("de"), v.literal("fr"), v.literal("ja")),
    title: v.string(),
    source: v.union(v.literal("paste"), v.literal("file"), v.literal("url")),
    rawText: v.string(),
    lastOpenedAt: v.optional(v.number()),
    lastTokenIndex: v.optional(v.number()),
    currentPage: v.optional(v.number()),
    tokenCount: v.number(),
    knownTokenCount: v.number(),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_language_createdAt", ["userId", "language", "createdAt"])
    .index("by_user_lastOpenedAt", ["userId", "lastOpenedAt"])
    .index("by_userId", ["userId"]),

  lessonTokens: defineTable({
    userId: v.string(),
    lessonId: v.id("lessons"),
    language: v.union(v.literal("de"), v.literal("fr"), v.literal("ja")),
    index: v.number(),
    surface: v.string(),
    normalized: v.optional(v.string()),
    isWord: v.boolean(),
    lemma: v.optional(v.string()),
    reading: v.optional(v.string()),
    pos: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_lesson_index", ["lessonId", "index"])
    .index("by_lesson_normalized", ["lessonId", "normalized"])
    .index("by_user_lesson", ["userId", "lessonId"]),

  vocab: defineTable({
    userId: v.string(),
    language: v.union(v.literal("de"), v.literal("fr"), v.literal("ja")),
    term: v.string(),
    display: v.string(),
    reading: v.optional(v.string()),
    pos: v.optional(v.string()),
    meaning: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.number(),
    reviews: v.optional(v.number()),
    nextReviewAt: v.optional(v.number()),
    intervalDays: v.optional(v.number()),
    ease: v.optional(v.number()),
    lastReviewedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_language_term", ["userId", "language", "term"])
    .index("by_user_language_status", ["userId", "language", "status"])
    .index("by_user_language_nextReviewAt", ["userId", "language", "nextReviewAt"])
    .index("by_user_language_createdAt", ["userId", "language", "createdAt"])
    .index("by_userId", ["userId"]),

  vocabStats: defineTable({
    userId: v.string(),
    language: v.union(v.literal("de"), v.literal("fr"), v.literal("ja")),
    total: v.number(),
    newCount: v.number(),
    learningCount: v.number(),
    knownCount: v.number(),
    updatedAt: v.number(),
  }).index("by_user_language", ["userId", "language"]),

  dictionaryCache: defineTable({
    language: v.union(v.literal("de"), v.literal("fr"), v.literal("ja")),
    keyTerm: v.string(),
    provider: v.string(),
    entries: v.optional(v.array(
      v.object({
        partOfSpeech: v.string(),
        phonetic: v.optional(v.string()),
        definitions: v.array(
          v.object({
            definition: v.string(),
            examples: v.optional(v.array(v.string())),
            synonyms: v.optional(v.array(v.string())),
            antonyms: v.optional(v.array(v.string())),
          })
        ),
      })
    )),
    cachedAt: v.number(),
  }).index("by_language_keyTerm", ["language", "keyTerm"]),

  reviewSessions: defineTable({
    userId: v.string(),
    language: v.union(v.literal("de"), v.literal("fr"), v.literal("ja")),
    status: v.union(v.literal("in_progress"), v.literal("completed"), v.literal("abandoned")),
    cardCount: v.number(),
    reviewedCount: v.number(),
    easeSum: v.number(),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_user_language", ["userId", "language"])
    .index("by_user_status", ["userId", "status"]),

  reviewSessionItems: defineTable({
    sessionId: v.id("reviewSessions"),
    vocabId: v.id("vocab"),
    quality: v.optional(v.number()),
    reviewedAt: v.optional(v.number()),
  })
    .index("by_session", ["sessionId"])
    .index("by_vocab", ["vocabId"]),
});
