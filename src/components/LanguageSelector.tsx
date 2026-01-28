import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '@/src/lib/utils';
import { useAppTheme } from '@/src/theme/AppThemeProvider';
import { LanguageFlag } from './LanguageFlag';
import { LANGUAGES, LANGUAGE_LABELS, type LanguageCode } from '@/src/lib/languages';

type LanguageSelectorProps = {
  value: LanguageCode;
  onChange: (language: LanguageCode) => void;
  showLabels?: boolean;
  size?: 'sm' | 'md';
  className?: string;
};

export function LanguageSelector({
  value,
  onChange,
  showLabels = true,
  size = 'md',
  className,
}: LanguageSelectorProps) {
  const { colors } = useAppTheme();
  const [open, setOpen] = useState(false);

  const flagSize = size === 'sm' ? 18 : 22;
  const buttonHeight = size === 'sm' ? 36 : 40;

  const options = useMemo(() => LANGUAGES, []);

  const handleSelect = (language: LanguageCode) => {
    onChange(language);
    setOpen(false);
  };

  return (
    <View className={cn('relative', className)}>
      <Pressable
        onPress={() => setOpen((prev) => !prev)}
        className={cn(
          'flex-row items-center justify-between rounded-xl border bg-panel px-3',
          showLabels ? 'gap-3' : 'justify-center'
        )}
        style={{
          height: buttonHeight,
          borderColor: colors['--border'],
        }}
        accessibilityRole="button"
        accessibilityLabel={`Selected language: ${LANGUAGE_LABELS[value]}`}
      >
        <View className={cn('flex-row items-center', showLabels ? 'gap-2' : '')}>
          <LanguageFlag code={value} size={flagSize} />
          {showLabels && (
            <Text className="text-sm font-sans-semibold text-ink">
              {LANGUAGE_LABELS[value]}
            </Text>
          )}
        </View>
        {showLabels && (
          <Ionicons
            name={open ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors['--subink']}
          />
        )}
      </Pressable>

      {open && (
        <View
          className={cn(
            'mt-2 rounded-xl border bg-panel p-1',
            showLabels ? '' : 'items-center'
          )}
          style={{ borderColor: colors['--border'] }}
        >
          {options.map((lang) => {
            const isActive = lang === value;
            return (
              <Pressable
                key={lang}
                onPress={() => handleSelect(lang)}
                className={cn(
                  'flex-row items-center rounded-lg px-3 py-2',
                  showLabels ? 'gap-2' : 'justify-center'
                )}
                style={
                  isActive
                    ? { backgroundColor: colors['--muted'] }
                    : undefined
                }
                accessibilityRole="button"
                accessibilityLabel={`Switch language to ${LANGUAGE_LABELS[lang]}`}
              >
                <LanguageFlag code={lang} size={flagSize} />
                {showLabels && (
                  <Text
                    className={cn(
                      'text-sm font-sans-medium',
                      isActive ? 'text-ink' : 'text-subink'
                    )}
                  >
                    {LANGUAGE_LABELS[lang]}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
