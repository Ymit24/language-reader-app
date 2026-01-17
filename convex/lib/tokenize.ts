export interface Token {
  surface: string;
  normalized?: string;
  isWord: boolean;
}

/**
 * Tokenizes text into a sequence of word and non-word tokens.
 *
 * Rules:
 * - Preserves all original characters (surface forms concatenate to original text)
 * - Words include internal apostrophes and hyphens (e.g., "d'accord", "E-Mail")
 * - Normalization: lowercase, strip surrounding punctuation (if any ended up in the word capture, though regex should prevent most)
 */
export function tokenize(text: string): Token[] {
  if (!text) return [];

  // Regex explanation:
  // We want to capture sequences that look like words, and everything else as non-words.
  // A "word" here allows for internal apostrophes and hyphens.
  //
  // \p{L}: Unicode letter
  // \p{N}: Unicode number
  //
  // Pattern:
  // [\p{L}\p{N}]+           Start with one or more letters/numbers
  // (?:['’\-_][\p{L}\p{N}]+)*  Followed optionally by (separator + letters/numbers) repeated
  //
  // Note: We include both straight quote ' and curly quote ’
  // We include hyphen - and underscore _ (sometimes used, though rare in standard text, good for safety)
  
  const wordPattern = /([\p{L}\p{N}]+(?:['’\-_][\p{L}\p{N}]+)*)/gu;
  
  const tokens: Token[] = [];
  let lastIndex = 0;
  let match;

  while ((match = wordPattern.exec(text)) !== null) {
    // 1. Capture non-word text before this match (whitespace, punctuation)
    if (match.index > lastIndex) {
      const nonWordSurface = text.slice(lastIndex, match.index);
      tokens.push({
        surface: nonWordSurface,
        isWord: false
      });
    }

    // 2. Capture the word
    const surface = match[0];
    tokens.push({
      surface,
      normalized: normalize(surface),
      isWord: true
    });

    lastIndex = wordPattern.lastIndex;
  }

  // 3. Capture any remaining non-word text at the end
  if (lastIndex < text.length) {
    tokens.push({
      surface: text.slice(lastIndex),
      isWord: false
    });
  }

  return tokens;
}

function normalize(surface: string): string {
  // Lowercase
  let normalized = surface.toLowerCase();
  
  // Note: The regex ensures we generally don't have *surrounding* punctuation 
  // like "Hello," -> "Hello" is the match, "," is skipped.
  // But just in case, or for specific edge cases, we could strip here.
  // Given our regex, 'surface' should strictly be the word chars + internal separators.
  
  return normalized;
}
