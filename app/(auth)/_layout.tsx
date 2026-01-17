import { Redirect, Stack } from 'expo-router';
import { Text } from 'react-native';
import { useConvexAuth } from 'convex/react';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return (
      <Text style={{ flex: 1, textAlign: 'center', marginTop: 100 }}>
        Loading...
      </Text>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(app)/library" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" />
    </Stack>
  );
}
