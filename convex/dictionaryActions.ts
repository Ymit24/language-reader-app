import { v } from "convex/values";
import { action } from "./_generated/server";

export type DictionaryEntry = {
  partOfSpeech: string;
  phonetic?: string;
  tags?: string[];
  definitions: {
    definition: string;
    examples?: string[];
    synonyms?: string[];
    antonyms?: string[];
  }[];
};

type LookupResult = {
  success: boolean;
  entries: DictionaryEntry[];
  lemma?: string;
  lemmaEntries: DictionaryEntry[];
  error?: string;
};

export const lookupDefinition = action({
  args: {
    language: v.union(v.literal("de"), v.literal("fr"), v.literal("ja")),
    term: v.string(),
  },
  handler: async (_ctx, args): Promise<LookupResult> => {
    const { term } = args;
    const apiTerm = term;

    try {
      const url = `http://christiansmith.live:3003/define/${args.language}?word=${encodeURIComponent(apiTerm)}`;
      console.log("Fetching from dictionary API:", url);

      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          return { success: true, entries: [], lemmaEntries: [] };
        }
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("API response:", JSON.stringify(data).substring(0, 1500));

      const entries: DictionaryEntry[] = (data.entries || []).map((entry: any) => ({
        partOfSpeech: entry.pos || "unknown",
        phonetic: entry.ipa?.[0],
        tags: entry.tags,
        definitions: (entry.senses || []).map((sense: any) => ({
          definition: (sense.glosses || []).join(" - ") || "",
          examples: sense.examples,
        })),
      }));

      const lemmaEntries: DictionaryEntry[] = (data.lemmaEntries || []).map((entry: any) => ({
        partOfSpeech: entry.pos || "unknown",
        phonetic: entry.ipa?.[0],
        tags: entry.tags,
        definitions: (entry.senses || []).map((sense: any) => ({
          definition: (sense.glosses || []).join(" - ") || "",
          examples: sense.examples,
        })),
      }));

      const lemma = data.lemmas?.[0];

      console.log("Parsed entries:", JSON.stringify(entries).substring(0, 500));
      console.log("Lemma:", lemma, "Lemma entries:", lemmaEntries.length);

      return { success: true, entries, lemma, lemmaEntries };
    } catch (error) {
      console.error("Dictionary lookup failed:", error);
      return { success: false, entries: [], lemmaEntries: [], error: String(error) };
    }
  },
});
