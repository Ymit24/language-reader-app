import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { useRouter, usePathname, Link, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '../lib/utils';

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
  const router = useRouter();

  return (
    <View 
      className="flex-col w-64 h-full bg-canvas border-r border-border"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="p-6">
        <Text className="text-xl font-bold text-ink">Reader</Text>
      </View>

      <View className="flex-1 px-4 gap-2">
        {NAV_ITEMS.map((item) => {
          // Simple active check: strictly starts with the href (for sub-routes)
          // except for root which might be tricky, but here all are deep paths.
          const isActive = pathname.startsWith(item.href);
          
          return (
            <Link key={item.name} href={item.href} asChild>
              <Pressable
                className={cn(
                  "flex-row items-center gap-3 p-3 rounded-xl transition-colors",
                  isActive ? "bg-brandSoft" : "hover:bg-muted"
                )}
              >
                <Ionicons 
                  name={isActive ? item.iconName.replace('-outline', '') as any : item.iconName} 
                  size={24} 
                  color={isActive ? "#2563eb" : "#4b5563"} 
                />
                <Text 
                  className={cn(
                    "text-base font-medium",
                    isActive ? "text-brand" : "text-subink"
                  )}
                >
                  {item.label}
                </Text>
              </Pressable>
            </Link>
          );
        })}
      </View>
    </View>
  );
}
