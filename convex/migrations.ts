import { mutation } from "./_generated/server";

const TABLES_WITH_USERID = [
  "userLanguages",
  "lessons",
  "lessonTokens",
  "vocab",
  "vocabStats",
] as const;

function extractUserId(subject: string): string | null {
  const parts = subject.split("|");
  return parts[0] || null;
}

export const fixUserIdFormat = mutation({
  args: {},
  handler: async (ctx) => {
    const results: Record<string, number> = {};

    for (const table of TABLES_WITH_USERID) {
      let fixedCount = 0;
      let cursor: string | null = null;

      while (true) {
        const paginationResult = await ctx.db
          .query(table as any)
          .withIndex("by_userId", (_q: any) => _q)
          .paginate({ cursor, numItems: 1000 });

        for (const doc of paginationResult.page) {
          const rawUserId = doc.userId;
          if (typeof rawUserId === "string" && rawUserId.includes("|")) {
            const correctUserId = extractUserId(rawUserId);
            if (correctUserId) {
              await ctx.db.patch(doc._id, { userId: correctUserId });
              fixedCount++;
            }
          }
        }

        if (!paginationResult.continueCursor) {
          break;
        }
        cursor = paginationResult.continueCursor;
      }

      if (fixedCount > 0) {
        results[table] = fixedCount;
      }
    }

    return results;
  },
});
