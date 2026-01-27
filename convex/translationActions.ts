import { v } from "convex/values";
import { action } from "./_generated/server";

type TranslateResult = {
  success: boolean;
  translatedText?: string;
  match?: number;
  truncated?: boolean;
  error?: string;
};

const MAX_QUERY_BYTES = 500;

const truncateToBytes = (value: string, maxBytes: number) => {
  const encoder = new TextEncoder();
  if (encoder.encode(value).length <= maxBytes) {
    return { text: value, truncated: false };
  }

  let output = "";
  let size = 0;
  for (const char of value) {
    const bytes = encoder.encode(char);
    if (size + bytes.length > maxBytes) break;
    output += char;
    size += bytes.length;
  }

  return { text: output, truncated: true };
};

export const translate = action({
  args: {
    sourceLanguage: v.union(v.literal("de"), v.literal("fr"), v.literal("ja")),
    targetLanguage: v.union(v.literal("en")),
    text: v.string(),
  },
  handler: async (_ctx, args): Promise<TranslateResult> => {
    const trimmed = args.text.trim();
    if (!trimmed) {
      return { success: false, error: "Empty text." };
    }

    const { text, truncated } = truncateToBytes(trimmed, MAX_QUERY_BYTES);
    const langPair = `${args.sourceLanguage}|${args.targetLanguage}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langPair)}&mt=1`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      if (data?.responseStatus && data.responseStatus !== 200) {
        return {
          success: false,
          error: data?.responseDetails || "Translation failed.",
          truncated,
        };
      }

      const translatedText = data?.responseData?.translatedText;
      const match = typeof data?.responseData?.match === "number"
        ? data.responseData.match
        : undefined;

      if (!translatedText) {
        return {
          success: false,
          error: "No translation found.",
          truncated,
        };
      }

      return {
        success: true,
        translatedText,
        match,
        truncated,
      };
    } catch (error) {
      console.error("Translation lookup failed:", error);
      return {
        success: false,
        error: String(error),
        truncated,
      };
    }
  },
});
