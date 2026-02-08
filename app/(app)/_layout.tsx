import { api } from '@/convex/_generated/api';
import { useSelectedLanguage } from '@/src/lib/selectedLanguage';
import { useAppTheme } from '@/src/theme/AppThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { useConvexAuth, useQuery } from 'convex/react';
import { Redirect, Tabs } from 'expo-router';
import {
  ActivityIndicator,
  Platform,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sidebar } from '../../src/components/Sidebar';

function LoadingScreen() {
  const { colors } = useAppTheme();
  return (
    <View className="flex-1 items-center justify-center bg-canvas">
      <View className="items-center gap-6">
        <View className="h-16 w-16 items-center justify-center rounded-2xl border border-border/40 bg-panel shadow-card">
          <ActivityIndicator size="small" color={colors['--brand']} />
        </View>
        <View className="items-center gap-2">
          <Text className="font-sans-semibold text-sm tracking-tight text-ink">
            Syncing
          </Text>
          <Text className="font-sans-bold text-[10px] uppercase tracking-[0.2em] text-faint">
            Authenticating
          </Text>
        </View>
      </View>
    </View>
  );
}

function ReviewTabIcon({
  color,
  size,
  focused,
}: {
  color: string;
  size: number;
  focused: boolean;
}) {
  const { colors } = useAppTheme();
  const { selectedLanguage } = useSelectedLanguage();
  const dueCount = useQuery(api.review.getDueCount, {
    language: selectedLanguage,
  });

  return (
    <View>
      <Ionicons
        name={focused ? 'flash' : 'flash-outline'}
        size={size}
        color={color}
      />
      {dueCount !== undefined && dueCount > 0 && (
        <View
          style={{
            position: 'absolute',
            right: -8,
            top: -4,
            backgroundColor: colors['--accent'],
            borderRadius: 10,
            minWidth: 18,
            height: 18,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 4,
          }}
        >
          <Text style={{ color: 'white', fontSize: 10, fontWeight: '600' }}>
            {dueCount > 99 ? '99+' : dueCount}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isLargeScreen = width >= 768;
  const { colors, alpha } = useAppTheme();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      {isLargeScreen && <Sidebar />}
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: colors['--brand'],
            tabBarInactiveTintColor: colors['--subink'],
            tabBarLabelStyle: {
              fontFamily: 'PlusJakartaSans_500Medium',
              fontSize: 11,
            },
            tabBarStyle: isLargeScreen
              ? { display: 'none' }
              : {
                  backgroundColor: colors['--canvas'],
                  borderTopWidth: 1,
                  borderTopColor: alpha('--border', 0.9),
                  ...Platform.select({
                    ios: {
                      height: 54 + insets.bottom,
                      paddingBottom: insets.bottom,
                      paddingTop: 10,
                    },
                    default: {
                      height: 76,
                      paddingBottom: 14,
                      paddingTop: 10,
                    },
                  }),
                },
          }}
        >
          <Tabs.Screen
            name="library"
            options={{
              title: 'Library',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="book" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="vocab"
            options={{
              title: 'Vocab',
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons
                  name={focused ? 'reader' : 'reader-outline'}
                  size={size}
                  color={color}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="review"
            options={{
              title: 'Review',
              tabBarIcon: ({ color, size, focused }) => (
                <ReviewTabIcon color={color} size={size} focused={focused} />
              ),
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: 'Settings',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="settings" size={size} color={color} />
              ),
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}
