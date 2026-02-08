import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import { ScreenLayout } from '@/src/components/ScreenLayout';
import { useRouter } from 'expo-router';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/src/components/Button';
import { Input } from '@/src/components/Input';
import { useAppTheme } from '@/src/theme/AppThemeProvider';

export default function NewLessonScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const createLesson = useMutation(api.lessons.createLesson);

  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [language, setLanguage] = useState<'fr' | 'de'>('fr');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a title');
      return;
    }
    if (!text.trim()) {
      Alert.alert('Required', 'Please paste some text');
      return;
    }

    setIsSubmitting(true);
    try {
      await createLesson({
        title: title.trim(),
        language,
        rawText: text,
      });
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to create lesson');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <ScreenLayout edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="z-10 flex-row items-center justify-between border-b border-border/70 bg-canvas/95 px-5 py-3">
          <Button variant="ghost" onPress={handleCancel}>
            Cancel
          </Button>
          <Text className="font-sans-semibold text-lg text-ink">
            New Lesson
          </Text>
          <Button
            variant="primary"
            onPress={handleCreate}
            disabled={isSubmitting || !title || !text}
            isLoading={isSubmitting}
            loadingText="Creating..."
          >
            Create
          </Button>
        </View>

        <ScrollView className="flex-1 px-5 py-6">
          <View className="gap-6">
            <Input
              label="Title"
              placeholder="e.g. My Trip to Paris"
              value={title}
              onChangeText={setTitle}
            />

            <View className="gap-2">
              <Text className="font-sans-semibold text-xs uppercase tracking-widest text-faint">
                Language
              </Text>
              <View className="flex-row gap-3 rounded-full border border-border/80 bg-panel p-1">
                <Pressable
                  onPress={() => setLanguage('fr')}
                  className={`flex-1 items-center justify-center rounded-full py-2 ${
                    language === 'fr'
                      ? 'border border-brand/20 bg-brandSoft'
                      : 'bg-transparent'
                  }`}
                >
                  <Text
                    className={`font-sans-semibold ${language === 'fr' ? 'text-ink' : 'text-subink'}`}
                  >
                    French
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setLanguage('de')}
                  className={`flex-1 items-center justify-center rounded-full py-2 ${
                    language === 'de'
                      ? 'border border-brand/20 bg-brandSoft'
                      : 'bg-transparent'
                  }`}
                >
                  <Text
                    className={`font-sans-semibold ${language === 'de' ? 'text-ink' : 'text-subink'}`}
                  >
                    German
                  </Text>
                </Pressable>
              </View>
            </View>

            <View className="min-h-[200px] flex-1 gap-2">
              <Text className="font-sans-semibold text-xs uppercase tracking-widest text-faint">
                Content
              </Text>
              <TextInput
                className="flex-1 rounded-xl border border-border/80 bg-panel p-4 font-serif text-base leading-relaxed text-ink"
                placeholder="Paste your text here..."
                placeholderTextColor={colors['--faint']}
                multiline
                textAlignVertical="top"
                value={text}
                onChangeText={setText}
                style={{ minHeight: 220 }}
              />
            </View>
          </View>
          <View className="h-10" />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}
