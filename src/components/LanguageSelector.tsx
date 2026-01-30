import { LANGUAGES, LANGUAGE_LABELS, type LanguageCode } from '@/src/lib/languages';
import { cn } from '@/src/lib/utils';
import { useAppTheme } from '@/src/theme/AppThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { LanguageFlag } from './LanguageFlag';

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
  const buttonRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const flagSize = size === 'sm' ? 18 : 22;
  const buttonHeight = size === 'sm' ? 36 : 40;

  const options = useMemo(() => LANGUAGES, []);

  const handleSelect = (language: LanguageCode) => {
    onChange(language);
    setOpen(false);
  };

  const closeDropdown = () => setOpen(false);

  const openDropdown = () => {
    if (buttonRef.current?.measureInWindow) {
      buttonRef.current.measureInWindow((x, y, width, height) => {
        setAnchor({ x, y, width, height });
        setOpen(true);
      });
    } else {
      setOpen(true);
    }
  };

  const toggleDropdown = () => {
    if (open) {
      closeDropdown();
      return;
    }
    openDropdown();
  };

  useEffect(() => {
    if (!open) return;
    if (!buttonRef.current?.measureInWindow) return;
    buttonRef.current.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
    });
  }, [open, windowWidth, windowHeight]);

  const availableWidth = windowWidth - 16;
  const menuBaseWidth = anchor?.width ?? 220;
  const menuWidth = Math.min(menuBaseWidth, availableWidth);
  const menuLeft = anchor
    ? Math.min(Math.max(anchor.x, 8), windowWidth - menuWidth - 8)
    : 8;
  const menuTop = anchor ? anchor.y + anchor.height + 8 : 0;

  return (
    <View className={cn('relative', className)}>
      <Pressable
        ref={buttonRef}
        onPress={toggleDropdown}
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

      <Modal
        transparent
        animationType="fade"
        visible={open}
        onRequestClose={closeDropdown}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeDropdown}
          />
          <View
            className={cn(
              'rounded-xl border bg-panel p-1',
              showLabels ? '' : 'items-center'
            )}
            style={{
              borderColor: colors['--border'],
              position: 'absolute',
              top: menuTop,
              left: menuLeft,
              width: menuWidth,
              maxWidth: availableWidth,
              zIndex: 10,
            }}
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
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
});
