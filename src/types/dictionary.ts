// Shared dictionary types used across the application
export interface DictionaryEntry {
  partOfSpeech: string;
  phonetic?: string;
  tags?: string[];
  definitions: {
    definition: string;
    examples?: string[];
    synonyms?: string[];
    antonyms?: string[];
  }[];
}

export interface LookupResult {
  success: boolean;
  entries: DictionaryEntry[];
  lemma?: string;
  lemmaEntries: DictionaryEntry[];
  error?: string;
}
