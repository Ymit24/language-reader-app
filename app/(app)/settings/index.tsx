import { View, Text, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthActions } from '@convex-dev/auth/react';
import { useConvexAuth } from 'convex/react';
import { Button } from '@/src/components/Button';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const { signOut } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await signOut();
              router.replace('/(auth)/sign-in');
            } catch {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const userEmail = isAuthenticated ? 'Signed in' : 'Not signed in';

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <View className="flex-1 px-4 py-6">
        <Text className="mb-6 text-2xl font-semibold tracking-tight text-ink">Settings</Text>

        <View className="gap-1 rounded-md border border-border bg-panel p-4">
          <Text className="text-xs font-medium text-faint uppercase tracking-wide">Account</Text>
          <View className="flex-row items-center justify-between py-2">
            <Text className="text-sm text-subink">Email</Text>
            <Text className="text-sm font-medium text-ink">{userEmail}</Text>
          </View>
        </View>

        <View className="mt-6 gap-1 rounded-md border border-border bg-panel p-4">
          <Text className="text-xs font-medium text-faint uppercase tracking-wide">About</Text>
          <View className="flex-row items-center justify-between py-2">
            <Text className="text-sm text-subink">Version</Text>
            <Text className="text-sm font-medium text-ink">1.0.0</Text>
          </View>
        </View>

        <View className="mt-8">
          <Button 
            variant="destructive" 
            onPress={handleSignOut}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#b91c1c" />
            ) : (
              'Sign Out'
            )}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
