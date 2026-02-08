import { Button } from '@/src/components/Button';
import { ScreenLayout } from '@/src/components/ScreenLayout';
import { cn } from '@/src/lib/utils';
import { useAppTheme } from '@/src/theme/AppThemeProvider';
import type { ThemePreference } from '@/src/theme/themes';
import { useAuthActions } from '@convex-dev/auth/react';
import { useConvexAuth } from 'convex/react';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

export default function SettingsScreen() {
  const { signOut } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { preference, setPreference, themes, resolvedThemeId } = useAppTheme();

  const handleSignOut = async () => {
    const confirmed =
      Platform.OS === 'web'
        ? window.confirm('Are you sure you want to sign out?')
        : await new Promise<boolean>((resolve) => {
            Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => resolve(false),
              },
              {
                text: 'Sign Out',
                style: 'destructive',
                onPress: () => resolve(true),
              },
            ]);
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
  const themeOptions: {
    id: ThemePreference;
    label: string;
    description: string;
  }[] = [
    {
      id: 'system',
      label: 'System',
      description: 'Match your device appearance.',
    },
    ...themes.map((theme) => ({
      id: theme.id,
      label: `${theme.label} (${theme.mode === 'dark' ? 'Dark' : 'Light'})`,
      description: theme.id === resolvedThemeId ? 'Active theme.' : '',
    })),
  ];

  return (
    <ScreenLayout edges={['top']}>
      <ScrollView
        className="flex-1 px-5 py-6"
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-2 font-sans-semibold text-2xl tracking-tight text-ink">
          Settings
        </Text>
        <Text className="mb-6 font-sans-medium text-sm text-subink">
          Account details and app preferences.
        </Text>

        <View className="gap-2 rounded-2xl border border-border/80 bg-panel/90 p-5 shadow-card">
          <Text className="font-sans-semibold text-xs uppercase tracking-widest text-faint">
            Account
          </Text>
          <View className="flex-row items-center justify-between py-2">
            <Text className="font-sans-medium text-sm text-subink">Email</Text>
            <Text className="font-sans-semibold text-sm text-ink">
              {userEmail}
            </Text>
          </View>
        </View>

        <View className="mt-6 gap-3 rounded-2xl border border-border/80 bg-panel/90 p-5 shadow-card">
          <View className="gap-1">
            <Text className="font-sans-semibold text-xs uppercase tracking-widest text-faint">
              Appearance
            </Text>
            <Text className="font-sans-medium text-sm text-subink">
              Choose a theme for this device.
            </Text>
          </View>
          <View className="gap-2">
            {themeOptions.map((option) => {
              const isSelected = preference === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => setPreference(option.id)}
                  className={cn(
                    'flex-row items-center justify-between rounded-xl border px-4 py-3',
                    isSelected
                      ? 'border-brand/60 bg-brandSoft/40'
                      : 'border-border/70 bg-panel/70',
                  )}
                >
                  <View className="flex-1">
                    <Text
                      className={cn(
                        'font-sans-semibold text-sm',
                        isSelected ? 'text-ink' : 'text-subink',
                      )}
                    >
                      {option.label}
                    </Text>
                    <Text className="mt-1 font-sans-medium text-xs text-faint">
                      {option.description}
                    </Text>
                  </View>
                  <View
                    className={cn(
                      'h-4 w-4 rounded-full border',
                      isSelected ? 'border-brand bg-brand' : 'border-border/60',
                    )}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="mt-6 gap-2 rounded-2xl border border-border/80 bg-panel/90 p-5 shadow-card">
          <Text className="font-sans-semibold text-xs uppercase tracking-widest text-faint">
            About
          </Text>
          <View className="flex-row items-center justify-between py-2">
            <Text className="font-sans-medium text-sm text-subink">
              Version
            </Text>
            <Text className="font-sans-semibold text-sm text-ink">1.0.0</Text>
          </View>
        </View>

        <View className="mt-8">
          <Button
            variant="destructive"
            onPress={handleSignOut}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#b42318" /> : 'Sign Out'}
          </Button>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}
