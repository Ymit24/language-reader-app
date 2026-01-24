import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { usePathname, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PanelLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated';
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
  { name: 'review', href: '/review', iconName: 'repeat', label: 'Review' },
  { name: 'vocab', href: '/vocab', iconName: 'list', label: 'Vocab' },
  { name: 'settings', href: '/settings', iconName: 'settings', label: 'Settings' },
];

const EXPANDED_WIDTH = 256;
const COLLAPSED_WIDTH = 80;

export function Sidebar() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const isCollapsed = useSharedValue(false);

  const toggleCollapse = () => {
    isCollapsed.value = !isCollapsed.value;
  };

  const sidebarWidthStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(isCollapsed.value ? COLLAPSED_WIDTH : EXPANDED_WIDTH, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
    };
  });

  const chevronRotationStyle = useAnimatedStyle(() => {
    return {
      transform: [{
        rotate: withTiming(isCollapsed.value ? '180deg' : '0deg', {
          duration: 300,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
      }],
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
      className="flex-col h-full bg-canvas border-r border-border/70"
      style={[sidebarWidthStyle, { paddingTop: insets.top, paddingBottom: insets.bottom, overflow: 'hidden' }]}
    >
      {/* Header */}
      <View className="h-16 flex-row items-center px-6 justify-between">
        <AnimatedView style={[labelContainerStyle, { overflow: 'hidden' }]}>
          <Text className="text-xl font-sans-bold text-ink" numberOfLines={1}>Reader</Text>
        </AnimatedView>
        
        <Pressable
          onPress={toggleCollapse}
          className="h-9 w-9 items-center justify-center rounded-full active:bg-muted/80"
          hitSlop={8}
        >
          <Animated.View style={chevronRotationStyle}>
            <PanelLeft size={20} color="#524a43" />
          </Animated.View>
        </Pressable>
      </View>

      {/* Nav Items */}
      <View className="flex-1 mt-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          
          return (
            <Link key={item.name} href={item.href} asChild>
              <Pressable
                className={cn(
                  "flex-row items-center h-11 px-4 mx-2 mb-1 rounded-xl transition-colors",
                  isActive ? "bg-brandSoft border border-brand/10" : "active:bg-muted/60 hover:bg-muted/40"
                )}
              >
                <View style={{ width: 24, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons 
                    name={item.iconName as any} 
                    size={22} 
                    color={isActive ? "#2f6b66" : "#524a43"} 
                  />
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
            </Link>
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
