import { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert, Pressable } from 'react-native';
import { SafeAreaView } from '@/src/components/SafeAreaView';
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
      <SafeAreaView className="flex-1 bg-canvas items-center justify-center" edges={['top']}>
        <Text className="text-ink">Loading...</Text>
      </SafeAreaView>
    );
  }

  if (lesson === null) {
    return (
      <SafeAreaView className="flex-1 bg-canvas items-center justify-center" edges={['top']}>
        <Text className="text-ink">Lesson not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-border bg-canvas z-10">
          <Button variant="ghost" onPress={handleCancel}>Cancel</Button>
          <Text className="text-lg font-semibold text-ink">Edit Lesson</Text>
          <Button
            variant="primary"
            onPress={handleSave}
            disabled={isSubmitting || !title || !text}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
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
                placeholderTextColor="#7A7466"
                multiline
                textAlignVertical="top"
                value={text}
                onChangeText={setText}
                style={{ minHeight: 200 }}
              />
            </View>

            <View className="h-px bg-border my-4" />

            <Button variant="destructive" onPress={handleDelete}>
              Delete Lesson
            </Button>
          </View>
          <View className="h-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
