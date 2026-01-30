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
      className="bg-panel rounded-2xl shadow-lift border border-border overflow-hidden w-full max-w-sm"
      style={style}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-3.5 py-2.5 bg-muted/20">
        <View className="flex-row items-center gap-2">
          {/* <Ionicons name="documents-outline" size={14} color={colors['--brand']} /> */}
          <Text className="text-[10px] font-sans-bold text-subink/80 uppercase tracking-widest">
            Selection
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <Pressable
            onPress={onAsk}
            className="h-7 px-3 flex-row items-center justify-center rounded-full bg-brand/10 active:bg-brand/20 mr-1"
            hitSlop={10}
            accessibilityLabel="Ask AI"
          >
            <Ionicons name="sparkles" size={12} color={colors['--brand']} />
            <Text className="text-xs text-brand font-sans-bold ml-1.5">Ask</Text>
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

      <View className="p-3.5 gap-4">
        {/* Selected Text Preview */}
        <View className="relative">
          <View className="absolute left-0 top-0 bottom-0 w-1 bg-brand/30 rounded-full" />
          <Text
            className="text-sm font-serif-italic text-ink/90 leading-relaxed pl-3.5"
            numberOfLines={4}
          >
            {selectedText}
          </Text>
        </View>

        {/* Translation Section */}
        <View className="pt-2 border-t border-border/20">
          {loading ? (
            <View className="flex-row items-center gap-2.5">
              <ActivityIndicator size="small" color={colors['--brand']} />
              <Text className="text-xs text-faint font-sans-medium tracking-wide">Translating...</Text>
            </View>
          ) : hasError ? (
            <Pressable
              onPress={() => setRetryCount((prev) => prev + 1)}
              className="flex-row items-center gap-2 bg-danger/5 px-2 py-1.5 rounded-lg active:bg-danger/10 self-start"
            >
              <Ionicons name="refresh" size={14} color={colors['--danger']} />
              <Text className="text-xs text-danger font-sans-medium">Retry translation</Text>
            </Pressable>
          ) : (
            <View className="gap-1.5">
              <View className="flex-row items-center gap-2 mb-1">
                <Ionicons name="language" size={12} color={colors['--subink']} style={{ opacity: 0.7 }} />
                <Text className="text-[10px] text-subink/70 font-sans-bold uppercase tracking-wider">English</Text>
              </View>
              <Text className="text-base text-ink leading-relaxed font-serif">
                {translation ?? 'No translation available.'}
              </Text>
              {isTruncated && (
                <Text className="text-[10px] text-faint font-sans-medium mt-1">
                  Translation trimmed.
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
