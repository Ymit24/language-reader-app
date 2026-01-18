import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from '@/src/components/SafeAreaView';
import { Input } from '@/src/components/Input';
import { Button } from '@/src/components/Button';
import { useAuthActions } from '@convex-dev/auth/react';
import { useState } from 'react';
import { router } from 'expo-router';

type AuthStep = 'signIn' | 'signUp';

export default function SignInScreen() {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<AuthStep>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    
    if (!email) {
      setError('Email is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await signIn('password', { email, password, flow: step });
      router.replace('/(app)/library');
    } catch (e: any) {
      setError(e?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = () => {
    setStep(step === 'signIn' ? 'signUp' : 'signIn');
    setError('');
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-full max-w-sm">
          <View className="mb-8 items-center">
            <Text className="text-3xl font-bold text-ink">Reader</Text>
            <Text className="mt-1 text-sm text-faint">Learn languages effectively</Text>
          </View>

          <View className="gap-4">
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              editable={!loading}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              secureTextEntry
              textContentType={step === 'signIn' ? 'password' : 'newPassword'}
              error={error}
              editable={!loading}
            />

            <Button 
              variant="primary" 
              onPress={handleSubmit} 
              disabled={loading}
              className="mt-2"
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                step === 'signIn' ? 'Sign In' : 'Create Account'
              )}
            </Button>

            <Pressable 
              onPress={toggleStep}
              className="items-center py-2"
              disabled={loading}
            >
              <Text className="text-sm text-subink">
                {step === 'signIn' 
                  ? "Don't have an account? Sign up" 
                  : 'Already have an account? Sign in'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
