import { Redirect } from 'expo-router';
import { Text, View } from 'react-native';
import { useConvexAuth } from 'convex/react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

function LoadingScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Loading...</Text>
    </View>
  );
}

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="library">
        <Icon sf={{ default: 'book', selected: 'book.fill' }} />
        <Label>Library</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="review">
        <Icon sf={{ default: 'repeat', selected: 'repeat' }} />
        <Label>Review</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} />
        <Label>Settings</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
