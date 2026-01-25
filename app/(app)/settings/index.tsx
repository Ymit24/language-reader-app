import { View, Text, Alert, ActivityIndicator, Platform, Pressable } from 'react-native';
import { useState } from 'react';
import { ScreenLayout } from '@/src/components/ScreenLayout';
import { useAuthActions } from '@convex-dev/auth/react';
import { useConvexAuth } from 'convex/react';
import { Button } from '@/src/components/Button';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/src/theme/AppThemeProvider';
import { cn } from '@/src/lib/utils';
import type { ThemePreference } from '@/src/theme/themes';

export default function SettingsScreen() {
  const { signOut } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { preference, setPreference, themes, resolvedThemeId } = useAppTheme();

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
  const themeOptions: { id: ThemePreference; label: string; description: string }[] = [
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

        <View className="mt-6 gap-3 rounded-2xl border border-border/80 bg-panel/90 p-5 shadow-card">
          <View className="gap-1">
            <Text className="text-xs font-sans-semibold text-faint uppercase tracking-widest">Appearance</Text>
            <Text className="text-sm text-subink font-sans-medium">
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
                      : 'border-border/70 bg-panel/70'
                  )}
                >
                  <View className="flex-1">
                    <Text className={cn('text-sm font-sans-semibold', isSelected ? 'text-ink' : 'text-subink')}>
                      {option.label}
                    </Text>
                    <Text className="text-xs text-faint font-sans-medium mt-1">
                      {option.description}
                    </Text>
                  </View>
                  <View
                    className={cn(
                      'h-4 w-4 rounded-full border',
                      isSelected ? 'bg-brand border-brand' : 'border-border/60'
                    )}
                  />
                </Pressable>
              );
            })}
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
