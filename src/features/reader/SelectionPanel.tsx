import { useAppTheme } from '@/src/theme/AppThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { useAction } from 'convex/react';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from 'react-native';
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

export function SelectionPanel({
  selectedText,
  language,
  onClose,
  onAsk,
  style,
}: SelectionPanelProps) {
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
      className="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-panel shadow-lift"
      style={style}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between bg-muted/20 px-3.5 py-2.5">
        <View className="flex-row items-center gap-2">
          {/* <Ionicons name="documents-outline" size={14} color={colors['--brand']} /> */}
          <Text className="font-sans-bold text-[10px] uppercase tracking-widest text-subink/80">
            Selection
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <Pressable
            onPress={onAsk}
            className="mr-1 h-7 flex-row items-center justify-center rounded-full bg-brand/10 px-3 active:bg-brand/20"
            hitSlop={10}
            accessibilityLabel="Ask AI"
          >
            <Ionicons name="sparkles" size={12} color={colors['--brand']} />
            <Text className="ml-1.5 font-sans-bold text-xs text-brand">
              Ask
            </Text>
          </Pressable>
          <Pressable
            onPress={onClose}
            className="h-7 w-7 items-center justify-center rounded-full active:bg-border/50"
            hitSlop={10}
          >
            <Ionicons name="close" size={18} color={colors['--subink']} />
          </Pressable>
        </View>
      </View>

      <View className="gap-4 p-3.5">
        {/* Selected Text Preview */}
        <View className="relative">
          <View className="absolute bottom-0 left-0 top-0 w-1 rounded-full bg-brand/30" />
          <Text
            className="pl-3.5 font-serif-italic text-sm leading-relaxed text-ink/90"
            numberOfLines={4}
          >
            {selectedText}
          </Text>
        </View>

        {/* Translation Section */}
        <View className="border-t border-border/20 pt-2">
          {loading ? (
            <View className="flex-row items-center gap-2.5">
              <ActivityIndicator size="small" color={colors['--brand']} />
              <Text className="font-sans-medium text-xs tracking-wide text-faint">
                Translating...
              </Text>
            </View>
          ) : hasError ? (
            <Pressable
              onPress={() => setRetryCount((prev) => prev + 1)}
              className="flex-row items-center gap-2 self-start rounded-lg bg-danger/5 px-2 py-1.5 active:bg-danger/10"
            >
              <Ionicons name="refresh" size={14} color={colors['--danger']} />
              <Text className="font-sans-medium text-xs text-danger">
                Retry translation
              </Text>
            </Pressable>
          ) : (
            <View className="gap-1.5">
              <View className="mb-1 flex-row items-center gap-2">
                <Ionicons
                  name="language"
                  size={12}
                  color={colors['--subink']}
                  style={{ opacity: 0.7 }}
                />
                <Text className="font-sans-bold text-[10px] uppercase tracking-wider text-subink/70">
                  English
                </Text>
              </View>
              <Text className="font-serif text-base leading-relaxed text-ink">
                {translation ?? 'No translation available.'}
              </Text>
              {isTruncated && (
                <Text className="mt-1 font-sans-medium text-[10px] text-faint">
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
