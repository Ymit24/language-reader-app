import { useAppTheme } from '@/src/theme/AppThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { useAction } from 'convex/react';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';
import { api } from '../../../convex/_generated/api';

interface SelectionPanelProps {
  selectedText: string;
  language: 'de' | 'fr' | 'ja';
  onClose: () => void;
  onAsk?: () => void;
  style?: StyleProp<ViewStyle>;
}

interface TranslationResult {
  success: boolean;
  translatedText?: string;
  match?: number;
  truncated?: boolean;
  error?: string;
}

export function SelectionPanel({ selectedText, language, onClose, onAsk, style }: SelectionPanelProps) {
  const { colors } = useAppTheme();
  const translateAction = useAction(api.translationActions.translate);
  const [translation, setTranslation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const trimmed = selectedText.trim();

    setLoading(true);
    setTranslation(null);
    setHasError(false);
    setIsTruncated(false);

    if (!trimmed) {
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    const fetchTranslation = async () => {
      try {
        const result = (await translateAction({
          sourceLanguage: language,
          targetLanguage: 'en',
          text: trimmed,
        })) as TranslationResult;

        if (!mounted) return;

        if (result.success && result.translatedText) {
          setTranslation(result.translatedText);
          setIsTruncated(Boolean(result.truncated));
        } else {
          setHasError(true);
        }
      } catch {
        if (mounted) {
          setHasError(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchTranslation();

    return () => {
      mounted = false;
    };
  }, [language, selectedText, translateAction, retryCount]);

  return (
    <View 
      className="bg-panel rounded-2xl shadow-pop border border-border/70 overflow-hidden w-full max-w-sm" 
      style={style}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-3 py-2 border-b border-border/50 bg-muted/30">
        <View className="flex-row items-center gap-2">
          <Ionicons name="documents-outline" size={14} color={colors['--brand']} />
          <Text className="text-[10px] font-sans-bold text-brand uppercase tracking-wider">
            Selection
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Pressable
            onPress={onAsk}
            className="h-7 px-3 flex-row items-center justify-center rounded-full bg-muted active:bg-border mr-1"
            hitSlop={10}
            accessibilityLabel="Ask AI"
          >
            <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors['--brand']} />
            <Text className="text-xs text-brand font-sans-medium ml-1.5">Ask</Text>
          </Pressable>
          <Pressable
            onPress={onClose}
            className="w-7 h-7 items-center justify-center rounded-full active:bg-border/50"
            hitSlop={10}
          >
            <Ionicons name="close" size={18} color={colors['--subink']} />
          </Pressable>
        </View>
      </View>

      <View className="p-3 gap-3">
        {/* Selected Text Preview */}
        <View className="bg-canvas rounded-lg p-2 border border-border/30">
          <Text 
            className="text-sm font-serif text-ink italic leading-relaxed" 
            numberOfLines={4}
          >
            "{selectedText}"
          </Text>
        </View>

        {/* Translation Section */}
        <View>
          {loading ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator size="small" color={colors['--brand']} />
              <Text className="text-xs text-faint italic font-serif">Translating...</Text>
            </View>
          ) : hasError ? (
            <Pressable
              onPress={() => setRetryCount((prev) => prev + 1)}
              className="flex-row items-center gap-2 bg-muted/40 px-2 py-1.5 rounded-lg active:bg-muted"
            >
              <Ionicons name="refresh" size={14} color={colors['--subink']} />
              <Text className="text-xs text-subink font-sans-medium">Unable to translate. Tap to retry.</Text>
            </Pressable>
          ) : (
            <View className="flex-row gap-2">
              <Ionicons name="language-outline" size={14} color={colors['--subink']} className="mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm text-ink leading-relaxed font-sans-medium">
                  {translation ?? 'No translation available.'}
                </Text>
                {isTruncated && (
                  <Text className="text-[10px] text-faint font-sans-medium mt-1">
                    Translation trimmed to fit MyMemory limits.
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
