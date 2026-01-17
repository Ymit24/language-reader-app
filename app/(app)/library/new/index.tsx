import { useState } from 'react';
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/src/components/Button';
import { Input } from '@/src/components/Input';

export default function NewLessonScreen() {
  const router = useRouter();
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
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-border bg-canvas z-10">
          <Button variant="ghost" onPress={handleCancel}>Cancel</Button>
          <Text className="text-lg font-semibold text-ink">New Lesson</Text>
          <Button 
            variant="primary" 
            onPress={handleCreate}
            disabled={isSubmitting || !title || !text}
          >
            {isSubmitting ? 'Creating...' : 'Create'}
          </Button>
        </View>

        <ScrollView className="flex-1 p-4">
          <View className="gap-6">
            <Input
              label="Title"
              placeholder="e.g. My Trip to Paris"
              value={title}
              onChangeText={setTitle}
            />

            <View className="gap-1.5">
              <Text className="text-sm font-medium text-ink">Language</Text>
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setLanguage('fr')}
                  className={`flex-1 items-center justify-center rounded-md border py-2.5 ${
                    language === 'fr' 
                      ? 'bg-brand/10 border-brand' 
                      : 'bg-panel border-border'
                  }`}
                >
                  <Text className={`font-medium ${language === 'fr' ? 'text-brand' : 'text-ink'}`}>
                    French
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setLanguage('de')}
                  className={`flex-1 items-center justify-center rounded-md border py-2.5 ${
                    language === 'de' 
                      ? 'bg-brand/10 border-brand' 
                      : 'bg-panel border-border'
                  }`}
                >
                  <Text className={`font-medium ${language === 'de' ? 'text-brand' : 'text-ink'}`}>
                    German
                  </Text>
                </Pressable>
              </View>
            </View>

            <View className="gap-1.5 flex-1 min-h-[200px]">
              <Text className="text-sm font-medium text-ink">Content</Text>
              <TextInput
                className="flex-1 rounded-md border border-border bg-panel p-3 text-base text-ink leading-relaxed"
                placeholder="Paste your text here..."
                placeholderTextColor="#9ca3af"
                multiline
                textAlignVertical="top"
                value={text}
                onChangeText={setText}
                style={{ minHeight: 200 }}
              />
            </View>
          </View>
          {/* Bottom spacer */}
          <View className="h-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
