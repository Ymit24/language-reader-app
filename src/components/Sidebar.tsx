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
      className="flex-col h-full bg-canvas border-r border-border"
      style={[sidebarWidthStyle, { paddingTop: insets.top, paddingBottom: insets.bottom, overflow: 'hidden' }]}
    >
      {/* Header */}
      <View className="h-20 flex-row items-center px-[28px] justify-between">
        <AnimatedView style={[labelContainerStyle, { overflow: 'hidden' }]}>
          <Text className="text-xl font-bold text-ink" numberOfLines={1}>Reader</Text>
        </AnimatedView>
        
        <Pressable
          onPress={toggleCollapse}
          className="rounded-lg active:bg-muted/50"
          hitSlop={8}
        >
          <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={chevronRotationStyle}>
              <PanelLeft size={20} color="#4b5563" />
            </Animated.View>
          </View>
        </Pressable>
      </View>

      {/* Nav Items */}
      <View className="flex-1 mt-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          
          return (
            <Link key={item.name} href={item.href} asChild>
              <Pressable
                className={cn(
                  "flex-row items-center h-12 px-[28px] mb-1 transition-colors",
                  isActive ? "bg-brandSoft" : "active:bg-muted/50 hover:bg-muted/30"
                )}
              >
                <View style={{ width: 24, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons 
                    name={item.iconName as any} 
                    size={22} 
                    color={isActive ? "#2563eb" : "#4b5563"} 
                  />
                </View>
                
                <AnimatedView style={[labelContainerStyle, { overflow: 'hidden' }]}>
                  <Text 
                    numberOfLines={1}
                    className={cn(
                      "text-base font-medium",
                      isActive ? "text-brand" : "text-subink"
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
      <View className="h-16 px-[28px] flex-row items-center">
        <AnimatedView style={[labelContainerStyle, { overflow: 'hidden' }]}>
          <Text className="text-xs text-faint" numberOfLines={1}>v1.0.0</Text>
        </AnimatedView>
      </View>
    </AnimatedView>
  );
}
