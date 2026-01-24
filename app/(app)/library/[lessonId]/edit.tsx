import { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert, Pressable } from 'react-native';
import { ScreenLayout } from '@/src/components/ScreenLayout';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/src/components/Button';
import { Input } from '@/src/components/Input';

export default function EditLessonScreen() {
  const router = useRouter();
  const { lessonId } = useLocalSearchParams();
  const lessonIdValidated = lessonId as string;
  const updateLesson = useMutation(api.lessons.updateLesson);
  const deleteLesson = useMutation(api.lessons.deleteLesson);

  const lesson = useQuery(api.lessons.getLesson, {
    lessonId: lessonIdValidated as Id<"lessons">,
  });

  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [language, setLanguage] = useState<'fr' | 'de' | 'ja'>('fr');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title);
      setText(lesson.rawText);
      setLanguage(lesson.language);
    }
  }, [lesson]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a title');
      return;
    }
    if (!text.trim()) {
      Alert.alert('Required', 'Please enter some text');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateLesson({
        lessonId: lessonIdValidated as Id<"lessons">,
        title: title.trim(),
        language,
        rawText: text,
      });
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to save lesson');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Lesson',
      'Are you sure you want to delete this lesson? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLesson({ lessonId: lessonIdValidated as Id<"lessons"> });
              router.replace('/library');
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'Failed to delete lesson');
            }
          },
        },
      ]
    );
  };

  if (lesson === undefined) {
    return (
      <ScreenLayout edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-ink font-sans-medium">Loading...</Text>
        </View>
      </ScreenLayout>
    );
  }

  if (lesson === null) {
    return (
      <ScreenLayout edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-ink font-sans-medium">Lesson not found</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-row items-center justify-between px-5 py-3 border-b border-border/70 bg-canvas/95 z-10">
          <Button variant="ghost" onPress={handleCancel}>Cancel</Button>
          <Text className="text-lg font-sans-semibold text-ink">Edit Lesson</Text>
          <Button
            variant="primary"
            onPress={handleSave}
            disabled={isSubmitting || !title || !text}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
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
              <Text className="text-xs font-sans-semibold uppercase tracking-widest text-faint">Language</Text>
              <View className="flex-row gap-3 rounded-full bg-panel border border-border/80 p-1">
                <Pressable
                  onPress={() => setLanguage('fr')}
                  className={`flex-1 items-center justify-center rounded-full py-2 ${
                    language === 'fr'
                      ? 'bg-brandSoft border border-brand/20'
                      : 'bg-transparent'
                  }`}
                >
                  <Text className={`font-sans-semibold ${language === 'fr' ? 'text-ink' : 'text-subink'}`}>
                    French
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setLanguage('de')}
                  className={`flex-1 items-center justify-center rounded-full py-2 ${
                    language === 'de'
                      ? 'bg-brandSoft border border-brand/20'
                      : 'bg-transparent'
                  }`}
                >
                  <Text className={`font-sans-semibold ${language === 'de' ? 'text-ink' : 'text-subink'}`}>
                    German
                  </Text>
                </Pressable>
              </View>
            </View>

            <View className="gap-2 flex-1 min-h-[200px]">
              <Text className="text-xs font-sans-semibold uppercase tracking-widest text-faint">Content</Text>
              <TextInput
                className="flex-1 rounded-xl border border-border/80 bg-panel p-4 text-base text-ink leading-relaxed font-serif"
                placeholder="Paste your text here..."
                placeholderTextColor="#80776e"
                multiline
                textAlignVertical="top"
                value={text}
                onChangeText={setText}
                style={{ minHeight: 220 }}
              />
            </View>

            <View className="h-px bg-border/70 my-2" />

            <Button variant="destructive" onPress={handleDelete}>
              Delete Lesson
            </Button>
          </View>
          <View className="h-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}
