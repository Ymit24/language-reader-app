import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { usePathname, useRouter } from 'expo-router';
import { PanelLeft, PanelRight } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '../lib/utils';
import { useAppTheme } from '@/src/theme/AppThemeProvider';

const AnimatedView = Animated.View;

type NavItemProps = {
  name: string;
  href: any;
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  badge?: number;
};

const NAV_ITEMS: NavItemProps[] = [
  { name: 'library', href: '/library', iconName: 'book', label: 'Library' },
  { name: 'vocab', href: '/vocab', iconName: 'reader', label: 'Vocab' },
  { name: 'review', href: '/review', iconName: 'flash', label: 'Review' },
  { name: 'settings', href: '/settings', iconName: 'settings', label: 'Settings' },
];

const EXPANDED_WIDTH = 256;
const COLLAPSED_WIDTH = 80;

export function Sidebar() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const { colors, alpha } = useAppTheme();
  const isCollapsed = useSharedValue(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const dueCount = useQuery(api.review.getTodayReviewCount);

  const toggleCollapse = () => {
    const next = !collapsed;
    isCollapsed.value = next;
    setCollapsed(next);
  };

  const sidebarWidthStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(isCollapsed.value ? COLLAPSED_WIDTH : EXPANDED_WIDTH, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
    };
  });

  const labelContainerStyle = useAnimatedStyle(() => {
    const isCollapsing = isCollapsed.value;
    return {
      opacity: withTiming(isCollapsing ? 0 : 1, { duration: 200 }),
      marginLeft: withTiming(isCollapsing ? 0 : 12, { duration: 300 }),
      maxWidth: withTiming(isCollapsing ? 0 : 160, { duration: 300 }),
    };
  });

  return (
    <AnimatedView
      className="flex-col h-full bg-canvas"
      style={[
        sidebarWidthStyle,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          overflow: 'hidden',
          borderRightWidth: 1,
          borderRightColor: alpha('--border', 0.7),
        }
      ]}
    >
      {/* Header */}

      <View className="h-16 flex-row items-center px-6 justify-between">
        {!collapsed && (
          <AnimatedView style={[labelContainerStyle, { overflow: 'hidden' }]}>
            <Text className="text-xl font-sans-bold text-ink" numberOfLines={1}>Reader</Text>
          </AnimatedView>
        )}

        <Pressable
          onPress={toggleCollapse}
          className="h-6 w-6 items-center justify-center rounded-full active:bg-muted/80"
          hitSlop={8}
        >
          {
            collapsed
              ? <PanelLeft size={20} color={colors['--subink']} />
              : <PanelRight size={20} color={colors['--subink']} />
          }
        </Pressable>
      </View>

      {/* Nav Items */}
      <View className="flex-1 mt-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const showBadge = item.name === 'review' && dueCount !== undefined && dueCount > 0;

          return (
            <Pressable
              key={item.name}
              onPress={() => router.push(item.href)}
              className="flex-row items-center h-11 px-4 mx-2 mb-1 rounded-xl"
              style={({ pressed }) => [
                isActive && {
                  backgroundColor: colors['--brandSoft'],
                  borderColor: alpha('--brand', 0.1),
                  borderWidth: 1,
                },
                pressed && !isActive && { backgroundColor: colors['--muted'] },
              ]}
              focusable={false}
              accessibilityRole="link"
            >
              <View style={{ width: 24, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons
                  name={item.iconName as any}
                  size={22}
                  color={isActive ? colors['--brand'] : colors['--subink']}
                />
                {showBadge && (
                  <View
                    style={{
                      position: 'absolute',
                      right: -8,
                      top: -6,
                      backgroundColor: colors['--accent'],
                      borderRadius: 8,
                      minWidth: 16,
                      height: 16,
                      justifyContent: 'center',
                      alignItems: 'center',
                      paddingHorizontal: 3,
                    }}
                  >
                    <Text style={{ color: 'white', fontSize: 9, fontWeight: '600' }}>
                      {dueCount > 99 ? '99+' : dueCount}
                    </Text>
                  </View>
                )}
              </View>

              <AnimatedView style={[labelContainerStyle, { overflow: 'hidden' }]}>
                <Text
                  numberOfLines={1}
                  className={cn(
                    "text-base font-sans-semibold",
                    isActive ? "text-ink" : "text-subink"
                  )}
                >
                  {item.label}
                </Text>
              </AnimatedView>
            </Pressable>
          );
        })}
      </View>

      {/* Footer */}
      <View className="h-14 px-6 flex-row items-center">
        <AnimatedView style={[labelContainerStyle, { overflow: 'hidden' }]}> 
          <Text className="text-xs text-faint font-sans-medium" numberOfLines={1}>v1.0.0</Text>
        </AnimatedView>
      </View>
    </AnimatedView>
  );
}
