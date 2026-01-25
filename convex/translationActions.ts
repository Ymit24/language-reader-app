import { v } from "convex/values";
import { action } from "./_generated/server";

export type TranslationResult = {
  success: boolean;
  translation?: string;
  sourceText?: string;
  error?: string;
};

/**
 * Translate a phrase using the MyMemory Translation API.
 * Free tier: 1000 requests/day for anonymous, more with email registration.
 * https://mymemory.translated.net/doc/spec.php
 */
export const translatePhrase = action({
  args: {
    text: v.string(),
    sourceLanguage: v.union(v.literal("de"), v.literal("fr"), v.literal("ja")),
    targetLanguage: v.optional(v.string()), // Defaults to "en"
  },
  handler: async (_ctx, args): Promise<TranslationResult> => {
    const { text, sourceLanguage } = args;
    const targetLanguage = args.targetLanguage || "en";

    // Validate text length (MyMemory limit is 500 bytes)
    const textBytes = new TextEncoder().encode(text).length;
    if (textBytes > 500) {
      return {
        success: false,
        sourceText: text,
        error: "Text too long (max 500 bytes)",
      };
    }

    if (!text.trim()) {
      return {
        success: false,
        sourceText: text,
        error: "Empty text",
      };
    }

    try {
      const langPair = `${sourceLanguage}|${targetLanguage}`;
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // MyMemory returns responseStatus 200 for success
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        const translation = data.responseData.translatedText;

        // MyMemory returns "PLEASE SELECT TWO DISTINCT LANGUAGES" for invalid pairs
        if (translation.includes("PLEASE SELECT TWO DISTINCT LANGUAGES")) {
          return {
            success: false,
            sourceText: text,
            error: "Invalid language pair",
          };
        }

        // Check for quota exceeded message
        if (
          translation.includes("MYMEMORY WARNING") ||
          translation.includes("QUOTA EXCEEDED")
        ) {
          return {
            success: false,
            sourceText: text,
            error: "Translation quota exceeded. Please try again later.",
          };
        }

        return {
          success: true,
          translation,
          sourceText: text,
        };
      }

      // Handle specific error messages from the API
      if (data.responseDetails) {
        return {
          success: false,
          sourceText: text,
          error: data.responseDetails,
        };
      }

      return {
        success: false,
        sourceText: text,
        error: "Translation failed",
      };
    } catch (error) {
      console.error("Translation API error:", error);
      return {
        success: false,
        sourceText: text,
        error: String(error),
      };
    }
  },
});
