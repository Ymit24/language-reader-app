import { View, Text, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { ScreenLayout } from '@/src/components/ScreenLayout';
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
    <ScreenLayout edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="w-full max-w-sm mx-auto bg-panel/90 border border-border/80 rounded-2xl p-6 shadow-card">
          <View className="mb-8 items-center">
            <Text className="text-3xl font-sans-bold text-ink">Reader</Text>
            <Text className="mt-2 text-sm text-subink font-sans-medium text-center">
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
              <Text className="text-sm text-subink font-sans-medium">
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
