import React, { useState } from 'react';
import { View, Text, Pressable, LayoutAnimation, Platform } from 'react-native';
import { usePathname, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '../lib/utils';
import { UIManager } from 'react-native';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

type NavItemProps = {
  name: string;
  href: any;
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
};

const NAV_ITEMS: NavItemProps[] = [
  { name: 'library', href: '/library', iconName: 'book-outline', label: 'Library' },
  { name: 'review', href: '/review', iconName: 'repeat-outline', label: 'Review' },
  { name: 'settings', href: '/settings', iconName: 'settings-outline', label: 'Settings' },
];

export function Sidebar() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsCollapsed(!isCollapsed);
  };

  const width = isCollapsed ? 80 : 256;

  return (
    <View 
      className="flex-col h-full bg-canvas border-r border-border"
      style={{ width, paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className={cn("flex-row items-center gap-3 px-4 py-6", isCollapsed ? 'justify-center' : 'justify-between')}>
        {!isCollapsed && (
          <Text className="text-xl font-bold text-ink">Reader</Text>
        )}
        <Pressable
          onPress={toggleCollapse}
          className={cn(
            "p-2 rounded-lg",
            isCollapsed ? 'mx-auto mt-2' : ''
          )}
          hitSlop={8}
        >
          <Ionicons 
            name={isCollapsed ? 'chevron-forward-outline' : 'chevron-back-outline'} 
            size={24} 
            color="#4b5563" 
          />
        </Pressable>
      </View>

      <View className={cn("flex-1 gap-2 px-3", isCollapsed ? 'items-center' : '')}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          
          return (
            <Link key={item.name} href={item.href} asChild>
              <Pressable
                className={cn(
                  "flex-row items-center gap-3 p-3 rounded-xl transition-colors w-full",
                  isActive ? "bg-brandSoft" : "hover:bg-muted"
                )}
                style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}
              >
                <Ionicons 
                  name={isActive ? item.iconName.replace('-outline', '') as any : item.iconName} 
                  size={24} 
                  color={isActive ? "#2563eb" : "#4b5563"} 
                />
                {!isCollapsed && (
                  <Text 
                    className={cn(
                      "text-base font-medium",
                      isActive ? "text-brand" : "text-subink"
                    )}
                  >
                    {item.label}
                  </Text>
                )}
              </Pressable>
            </Link>
          );
        })}
      </View>

      <View className={cn("px-3 py-4", isCollapsed ? 'items-center' : '')}>
        {!isCollapsed && (
          <Text className="text-xs text-faint px-3">v1.0.0</Text>
        )}
      </View>
    </View>
  );
}
