import { View, Text, Alert, ActivityIndicator, Platform } from 'react-native';
import { useState } from 'react';
import { ScreenLayout } from '@/src/components/ScreenLayout';
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
    const confirmed = Platform.OS === 'web'
      ? window.confirm('Are you sure you want to sign out?')
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              {
                text: 'Sign Out',
                style: 'destructive',
                onPress: () => resolve(true),
              },
            ]
          );
        });

    if (!confirmed) return;

    setLoading(true);
    try {
      await signOut();
      router.replace('/(auth)/sign-in');
    } catch {
      if (Platform.OS === 'web') {
        alert('Failed to sign out. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to sign out. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const userEmail = isAuthenticated ? 'Signed in' : 'Not signed in';

  return (
    <ScreenLayout edges={['top']}>
      <View className="flex-1 px-5 pt-6">
        <Text className="mb-2 text-2xl font-sans-semibold tracking-tight text-ink">Settings</Text>
        <Text className="mb-6 text-sm text-subink font-sans-medium">
          Account details and app preferences.
        </Text>

        <View className="gap-2 rounded-2xl border border-border/80 bg-panel/90 p-5 shadow-card">
          <Text className="text-xs font-sans-semibold text-faint uppercase tracking-widest">Account</Text>
          <View className="flex-row items-center justify-between py-2">
            <Text className="text-sm text-subink font-sans-medium">Email</Text>
            <Text className="text-sm font-sans-semibold text-ink">{userEmail}</Text>
          </View>
        </View>

        <View className="mt-6 gap-2 rounded-2xl border border-border/80 bg-panel/90 p-5 shadow-card">
          <Text className="text-xs font-sans-semibold text-faint uppercase tracking-widest">About</Text>
          <View className="flex-row items-center justify-between py-2">
            <Text className="text-sm text-subink font-sans-medium">Version</Text>
            <Text className="text-sm font-sans-semibold text-ink">1.0.0</Text>
          </View>
        </View>

        <View className="mt-8">
          <Button 
            variant="destructive" 
            onPress={handleSignOut}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#b42318" />
            ) : (
              'Sign Out'
            )}
          </Button>
        </View>
      </View>
    </ScreenLayout>
  );
}
