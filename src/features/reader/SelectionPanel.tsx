import { useAppTheme } from '@/src/theme/AppThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';

interface SelectionPanelProps {
  selectedText: string;
  onClose: () => void;
  onAsk?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function SelectionPanel({ selectedText, onClose, onAsk, style }: SelectionPanelProps) {
  const { colors } = useAppTheme();
  const [translation, setTranslation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setTranslation(null);

    // Simulate API call
    const timer = setTimeout(() => {
      if (mounted) {
        setTranslation("This is a placeholder translation for the selected text. In the future, this will be replaced by a real translation from the API.");
        setLoading(false);
      }
    }, 1000);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [selectedText]);

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
          ) : (
             <View className="flex-row gap-2">
                 <Ionicons name="language-outline" size={14} color={colors['--subink']} className="mt-0.5" />
                 <Text className="text-sm text-ink leading-relaxed font-sans-medium flex-1">
                  {translation}
                </Text>
             </View>
          )}
        </View>
      </View>
    </View>
  );
}
