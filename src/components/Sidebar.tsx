import { api } from '@/convex/_generated/api';
import { LanguageSelector } from '@/src/components/LanguageSelector';
import { useSelectedLanguage } from '@/src/lib/selectedLanguage';
import { useAppTheme } from '@/src/theme/AppThemeProvider';
import { useAuthActions } from '@convex-dev/auth/react';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { usePathname, useRouter } from 'expo-router';
import { PanelLeft, PanelRight } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '../lib/utils';

const AnimatedView = Animated.View;

type NavItemProps = {
  name: string;
  href: any;
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
};

const NAV_ITEMS: NavItemProps[] = [
  { name: 'library', href: '/library', iconName: 'book', label: 'Library' },
  { name: 'vocab', href: '/vocab', iconName: 'reader', label: 'Vocab' },
  { name: 'review', href: '/review', iconName: 'flash', label: 'Review' },
];

const EXPANDED_WIDTH = 260;
const COLLAPSED_WIDTH = 72;

export function Sidebar() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuthActions();
  const { colors, alpha } = useAppTheme();
  const { selectedLanguage, setSelectedLanguage } = useSelectedLanguage();
  const isCollapsed = useSharedValue(false);
  const [collapsed, setCollapsed] = React.useState(false);

  // Data fetching
  const dueCount = useQuery(api.review.getDueCount, {
    language: selectedLanguage,
  });
  const progress = useQuery(api.progress.getProgress);

  const toggleCollapse = () => {
    const next = !collapsed;
    isCollapsed.value = next;
    setCollapsed(next);
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/sign-in');
  };

  const sidebarWidthStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(isCollapsed.value ? COLLAPSED_WIDTH : EXPANDED_WIDTH, {
        duration: 350,
        easing: Easing.bezier(0.2, 0, 0, 1),
      }),
    };
  });

  const fadeStyle = useAnimatedStyle(() => {
    const isCollapsing = isCollapsed.value;
    return {
      opacity: withTiming(isCollapsing ? 0 : 1, { duration: 250 }),
    };
  });

  return (
    <AnimatedView
      className="z-50 h-full flex-col bg-panel shadow-sm"
      style={[
        sidebarWidthStyle,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          borderRightWidth: 1,
          borderRightColor: alpha('--border', 0.6),
        },
      ]}
    >
      {/* Header */}
      <View
        className={cn(
          'h-16 flex-row items-center px-4',
          collapsed ? 'justify-center' : 'justify-between',
        )}
      >
        {!collapsed && (
          <AnimatedView style={[fadeStyle, { overflow: 'hidden', flex: 1 }]}>
            <View className="flex-row items-center gap-2">
              <View className="h-8 w-8 items-center justify-center rounded-lg bg-brand/10">
                <Ionicons name="book" size={18} color={colors['--brand']} />
              </View>
              <Text className="font-sans-bold text-lg tracking-tight text-ink">
                Reader
              </Text>
            </View>
          </AnimatedView>
        )}

        <Pressable
          onPress={toggleCollapse}
          className="h-8 w-8 items-center justify-center rounded-lg hover:bg-muted active:bg-muted/80"
          style={({ pressed }) =>
            pressed && { backgroundColor: colors['--muted'] }
          }
        >
          {collapsed ? (
            <PanelLeft size={18} color={colors['--subink']} />
          ) : (
            <PanelRight size={18} color={colors['--subink']} />
          )}
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-3"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Language Selector Section */}
        <View className="mb-6 mt-2">
          {!collapsed && (
            <Text className="mb-2 px-2 font-sans-bold text-xs uppercase tracking-wider text-faint">
              Learning
            </Text>
          )}
          <View className={cn(collapsed && 'items-center')}>
            <LanguageSelector
              value={selectedLanguage}
              onChange={setSelectedLanguage}
              showLabels={!collapsed}
              size="md"
              className="w-full"
            />
          </View>
        </View>

        {/* Navigation Items */}
        <View className="mb-6 gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const showBadge =
              item.name === 'review' && dueCount !== undefined && dueCount > 0;

            return (
              <Pressable
                key={item.name}
                onPress={() => router.push(item.href)}
                className={cn(
                  'h-10 flex-row items-center rounded-lg transition-colors',
                  collapsed ? 'justify-center px-0' : 'px-3',
                )}
                style={({ pressed }) => [
                  isActive && {
                    backgroundColor: colors['--brandSoft'],
                  },
                  pressed &&
                    !isActive && { backgroundColor: colors['--muted'] },
                ]}
              >
                <View className="relative">
                  <Ionicons
                    name={
                      isActive
                        ? item.iconName
                        : (`${item.iconName}-outline` as any)
                    }
                    size={20}
                    color={isActive ? colors['--brand'] : colors['--subink']}
                  />
                  {collapsed && showBadge && (
                    <View className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border border-panel bg-accent" />
                  )}
                </View>

                {!collapsed && (
                  <>
                    <AnimatedView
                      style={[fadeStyle, { marginLeft: 12, flex: 1 }]}
                    >
                      <Text
                        numberOfLines={1}
                        className={cn(
                          'text-sm',
                          isActive
                            ? 'font-sans-bold text-ink'
                            : 'font-sans-medium text-subink',
                        )}
                      >
                        {item.label}
                      </Text>
                    </AnimatedView>

                    {showBadge && (
                      <AnimatedView style={[fadeStyle, { marginLeft: 8 }]}>
                        <View className="h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1.5">
                          <Text className="font-sans-bold text-[10px] leading-none text-white">
                            {dueCount && dueCount > 99 ? '99+' : dueCount}
                          </Text>
                        </View>
                      </AnimatedView>
                    )}

                    {isActive && (
                      <AnimatedView style={[fadeStyle, { marginLeft: 8 }]}>
                        <View className="h-1.5 w-1.5 rounded-full bg-brand" />
                      </AnimatedView>
                    )}
                  </>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer */}
      <View
        className={cn(
          'gap-1 border-t border-border/50 p-3',
          collapsed && 'items-center',
        )}
      >
        <Pressable
          onPress={() => router.push('/settings')}
          className={cn(
            'h-10 flex-row items-center rounded-lg',
            collapsed ? 'w-10 justify-center' : 'px-3',
          )}
          style={({ pressed }) => [
            pressed && { backgroundColor: colors['--muted'] },
            pathname.startsWith('/settings') && {
              backgroundColor: colors['--brandSoft'],
            },
          ]}
        >
          <Ionicons
            name="settings-outline"
            size={20}
            color={
              pathname.startsWith('/settings')
                ? colors['--brand']
                : colors['--subink']
            }
          />
          {!collapsed && (
            <AnimatedView style={[fadeStyle, { marginLeft: 12 }]}>
              <Text
                className={cn(
                  'font-sans-medium text-sm',
                  pathname.startsWith('/settings') ? 'text-ink' : 'text-subink',
                )}
              >
                Settings
              </Text>
            </AnimatedView>
          )}
        </Pressable>
      </View>
    </AnimatedView>
  );
}
