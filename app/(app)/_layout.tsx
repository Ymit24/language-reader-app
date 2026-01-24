import { Redirect, Tabs } from 'expo-router';
import { Text, View, useWindowDimensions } from 'react-native';
import { useConvexAuth, useQuery } from 'convex/react';
import { Ionicons } from '@expo/vector-icons';
import { Sidebar } from '../../src/components/Sidebar';
import { api } from '@/convex/_generated/api';

function LoadingScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Loading...</Text>
    </View>
  );
}

function ReviewTabIcon({ color, size, focused }: { color: string; size: number; focused: boolean }) {
  const dueCount = useQuery(api.review.getTodayReviewCount);
  
  return (
    <View>
      <Ionicons name={focused ? "flash" : "flash-outline"} size={size} color={color} />
      {dueCount !== undefined && dueCount > 0 && (
        <View
          style={{
            position: 'absolute',
            right: -8,
            top: -4,
            backgroundColor: '#b56a2c',
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
  const isLargeScreen = width >= 768;

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
            tabBarActiveTintColor: '#2f6b66',
            tabBarInactiveTintColor: '#524a43',
            tabBarLabelStyle: {
              fontFamily: 'PlusJakartaSans_500Medium',
            },
            tabBarStyle: isLargeScreen
              ? { display: 'none' }
              : {
                  backgroundColor: '#f6f2ea',
                  borderTopWidth: 1,
                  borderTopColor: '#e1d7c9',
                  paddingTop: 6,
                  height: 64,
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
            name="review"
            options={{
              title: 'Review',
              tabBarIcon: ({ color, size, focused }) => (
                <ReviewTabIcon color={color} size={size} focused={focused} />
              ),
            }}
          />
          <Tabs.Screen
            name="vocab"
            options={{
              title: 'Vocab',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="list" size={size} color={color} />
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
