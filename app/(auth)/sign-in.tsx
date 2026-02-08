import { Button } from '@/src/components/Button';
import { Input } from '@/src/components/Input';
import { ScreenLayout } from '@/src/components/ScreenLayout';
import { useAuthActions } from '@convex-dev/auth/react';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

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

  const dismissKeyboard = () => {
    if (Platform.OS !== 'web') {
      Keyboard.dismiss();
    }
  };

  return (
    <ScreenLayout edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              paddingHorizontal: 24,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="mx-auto w-full max-w-sm rounded-2xl border border-border/80 bg-panel/90 p-6 shadow-card">
              <View className="mb-8 items-center">
                <Text className="font-sans-bold text-3xl text-ink">Reader</Text>
                <Text className="mt-2 text-center font-sans-medium text-sm text-subink">
                  Learn with a calm, focused reading flow.
                </Text>
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
                  textContentType={
                    step === 'signIn' ? 'password' : 'newPassword'
                  }
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
                  ) : step === 'signIn' ? (
                    'Sign In'
                  ) : (
                    'Create Account'
                  )}
                </Button>

                <Pressable
                  onPress={toggleStep}
                  className="items-center py-2"
                  disabled={loading}
                >
                  <Text className="font-sans-medium text-sm text-subink">
                    {step === 'signIn'
                      ? "Don't have an account? Sign up"
                      : 'Already have an account? Sign in'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}
