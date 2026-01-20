import { Redirect, Tabs } from 'expo-router';
import { Text, View, useWindowDimensions } from 'react-native';
import { useConvexAuth } from 'convex/react';
import { Ionicons } from '@expo/vector-icons';
import { Sidebar } from '../../src/components/Sidebar';

function LoadingScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Loading...</Text>
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
            tabBarActiveTintColor: '#C4643B',
            tabBarInactiveTintColor: '#5C5648',
            tabBarStyle: isLargeScreen
              ? { display: 'none' }
              : {
                  backgroundColor: '#FDFBF7',
                  borderTopWidth: 1,
                  borderTopColor: '#E8E4DC',
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
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="repeat" size={size} color={color} />
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
