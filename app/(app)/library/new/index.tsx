import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import { ScreenLayout } from '@/src/components/ScreenLayout';
import { useRouter } from 'expo-router';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button, IconButton } from '@/src/components/Button';
import { Input } from '@/src/components/Input';
import { useAppTheme } from '@/src/theme/AppThemeProvider';
import * as ImagePicker from 'expo-image-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { AlertTriangle, Camera, CheckCircle2, Clock, Images, Trash2 } from 'lucide-react-native';

type ScanStatus = 'queued' | 'processing' | 'done' | 'error';

type ScanPage = {
  id: string;
  uri: string;
  status: ScanStatus;
  text: string;
};

export default function NewLessonScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const createLesson = useMutation(api.lessons.createLesson);

  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [language, setLanguage] = useState<'fr' | 'de'>('fr');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanPages, setScanPages] = useState<ScanPage[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const scanSummary = useMemo(() => {
    const summary = scanPages.reduce(
      (acc, page) => {
        if (page.status === 'done') acc.done += 1;
        if (page.status === 'processing') acc.processing += 1;
        if (page.status === 'error') acc.error += 1;
        if (page.status === 'queued') acc.queued += 1;
        return acc;
      },
      { done: 0, processing: 0, error: 0, queued: 0 }
    );

    return {
      ...summary,
      total: scanPages.length,
    };
  }, [scanPages]);

  const updateScanPage = (id: string, updates: Partial<ScanPage>) => {
    setScanPages((prev) =>
      prev.map((page) => (page.id === id ? { ...page, ...updates } : page))
    );
  };

  const appendRecognizedText = (recognizedText: string) => {
    const cleanText = recognizedText.trim();
    if (!cleanText) return;

    setText((current) => {
      const shouldAddSpacing = current.trim().length > 0;
      return `${current}${shouldAddSpacing ? '\n\n' : ''}${cleanText}`;
    });
  };

  const scanSinglePage = async (page: ScanPage) => {
    updateScanPage(page.id, { status: 'processing' });
    try {
      const result = await TextRecognition.recognize(page.uri);
      const recognizedText = result.text ?? '';
      updateScanPage(page.id, { status: 'done', text: recognizedText });
      appendRecognizedText(recognizedText);
    } catch (error) {
      console.error(error);
      updateScanPage(page.id, { status: 'error' });
    }
  };

  const scanPagesInOrder = async (pages: ScanPage[]) => {
    if (pages.length === 0) return;
    setIsScanning(true);
    for (const page of pages) {
      await scanSinglePage(page);
    }
    setIsScanning(false);
  };

  const handleAddScanPages = async (assets: ImagePicker.ImagePickerAsset[]) => {
    const newPages = assets.map((asset, index) => ({
      id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      uri: asset.uri,
      status: 'queued' as ScanStatus,
      text: '',
    }));

    setScanPages((prev) => [...prev, ...newPages]);
    await scanPagesInOrder(newPages);
  };

  const handlePickPhotos = async () => {
    if (isScanning) return;
    if (Platform.OS === 'web') {
      Alert.alert('Not supported on web', 'Text recognition is available on iOS and Android.');
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to scan pages.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsMultipleSelection: true,
      selectionLimit: 0,
    });

    if (result.canceled) return;
    await handleAddScanPages(result.assets);
  };

  const handleTakePhoto = async () => {
    if (isScanning) return;
    if (Platform.OS === 'web') {
      Alert.alert('Camera unavailable', 'Please choose photos on web for now.');
      return;
    }
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow camera access to scan pages.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (result.canceled) return;
    await handleAddScanPages(result.assets);
  };

  const handleRetryScan = async (page: ScanPage) => {
    if (isScanning) return;
    setIsScanning(true);
    await scanSinglePage(page);
    setIsScanning(false);
  };

  const handleRemoveScanPage = (pageId: string) => {
    setScanPages((prev) => prev.filter((page) => page.id !== pageId));
  };

  const handleCreate = async () => {
    if (isScanning) {
      Alert.alert('Scanning in progress', 'Please wait until scanning finishes.');
      return;
    }
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
        <View className="flex-row items-center justify-between px-5 py-3 border-b border-border/70 bg-canvas/95 z-10">
          <Button variant="ghost" onPress={handleCancel}>Cancel</Button>
          <Text className="text-lg font-sans-semibold text-ink">New Lesson</Text>
          <Button 
            variant="primary" 
            onPress={handleCreate}
            disabled={isSubmitting || isScanning || !title || !text}
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

            <View className="gap-2">
              <Text className="text-xs font-sans-semibold uppercase tracking-widest text-faint">Scan pages</Text>
              <View className="gap-4 rounded-2xl border border-border/80 bg-panel px-4 py-5">
                <View className="gap-2">
                  <Text className="text-base font-sans-semibold text-ink">Capture printed pages</Text>
                  <Text className="text-sm text-subink leading-relaxed">
                    Snap or select multiple photos and we will extract the text directly into your lesson.
                  </Text>
                </View>
                <View className="flex-row flex-wrap gap-3">
                  <Button
                    variant="secondary"
                    onPress={handleTakePhoto}
                    disabled={isScanning}
                    className="flex-1 min-w-[140px]"
                  >
                    <View className="flex-row items-center justify-center gap-2">
                      <Camera size={16} color={colors['--ink']} />
                      <Text className="text-sm font-sans-semibold text-ink">Take photo</Text>
                    </View>
                  </Button>
                  <Button
                    variant="secondary"
                    onPress={handlePickPhotos}
                    disabled={isScanning}
                    className="flex-1 min-w-[140px]"
                  >
                    <View className="flex-row items-center justify-center gap-2">
                      <Images size={16} color={colors['--ink']} />
                      <Text className="text-sm font-sans-semibold text-ink">Choose photos</Text>
                    </View>
                  </Button>
                </View>
                {isScanning && (
                  <View className="flex-row items-center gap-2">
                    <ActivityIndicator size="small" color={colors['--brand']} />
                    <Text className="text-sm text-subink">Scanning pages, hang tight…</Text>
                  </View>
                )}
                {scanPages.length > 0 && (
                  <View className="gap-3 border-t border-border/70 pt-4">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs font-sans-semibold uppercase tracking-widest text-faint">
                        Pages
                      </Text>
                      <Text className="text-xs text-subink">
                        {scanSummary.done} scanned · {scanSummary.total} total
                      </Text>
                    </View>
                    <View className="gap-3">
                      {scanPages.map((page, index) => {
                        const statusLabel =
                          page.status === 'processing'
                            ? 'Scanning'
                            : page.status === 'done'
                              ? 'Scanned'
                              : page.status === 'error'
                                ? 'Needs retry'
                                : 'Queued';
                        const statusBadge =
                          page.status === 'processing'
                            ? 'bg-brandSoft'
                            : page.status === 'done'
                              ? 'bg-successSoft'
                              : page.status === 'error'
                                ? 'bg-dangerSoft'
                                : 'bg-muted';
                        const statusText =
                          page.status === 'processing'
                            ? 'text-ink'
                            : page.status === 'done'
                              ? 'text-success'
                              : page.status === 'error'
                                ? 'text-danger'
                                : 'text-subink';

                        return (
                          <View
                            key={page.id}
                            className="flex-row items-center gap-3 rounded-xl border border-border/70 bg-canvas/70 p-3"
                          >
                            <Image
                              source={{ uri: page.uri }}
                              className="h-14 w-14 rounded-lg bg-muted"
                              resizeMode="cover"
                            />
                            <View className="flex-1 gap-1">
                              <Text className="text-sm font-sans-semibold text-ink">
                                Page {index + 1}
                              </Text>
                              <Text className="text-xs text-subink" numberOfLines={1}>
                                {page.status === 'done'
                                  ? page.text.trim()
                                    ? 'Text captured'
                                    : 'No text detected'
                                  : page.status === 'processing'
                                    ? 'Running OCR…'
                                    : page.status === 'error'
                                      ? 'Tap retry to scan again'
                                      : 'Queued for scanning'}
                              </Text>
                            </View>
                            <View className="items-end gap-2">
                              <View className={`flex-row items-center gap-1.5 rounded-full px-2.5 py-1 ${statusBadge}`}>
                                {page.status === 'processing' ? (
                                  <ActivityIndicator size="small" color={colors['--brand']} />
                                ) : page.status === 'done' ? (
                                  <CheckCircle2 size={12} color={colors['--success']} />
                                ) : page.status === 'error' ? (
                                  <AlertTriangle size={12} color={colors['--danger']} />
                                ) : (
                                  <Clock size={12} color={colors['--faint']} />
                                )}
                                <Text className={`text-[11px] font-sans-semibold ${statusText}`}>
                                  {statusLabel}
                                </Text>
                              </View>
                              <View className="flex-row items-center gap-2">
                                {page.status === 'error' && (
                                  <Pressable
                                    onPress={() => handleRetryScan(page)}
                                    className="rounded-full border border-border/70 px-2.5 py-1"
                                  >
                                    <Text className="text-[11px] font-sans-semibold text-subink">Retry</Text>
                                  </Pressable>
                                )}
                                <IconButton
                                  accessibilityLabel="Remove scan"
                                  onPress={() => handleRemoveScanPage(page.id)}
                                  className="h-8 w-8"
                                >
                                  <Trash2 size={14} color={colors['--faint']} />
                                </IconButton>
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                    <Text className="text-xs text-faint leading-relaxed">
                      Scanned text is appended to the content field below. You can edit or reorder it there.
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View className="gap-2 flex-1 min-h-[200px]">
              <Text className="text-xs font-sans-semibold uppercase tracking-widest text-faint">Content</Text>
              <TextInput
                className="flex-1 rounded-xl border border-border/80 bg-panel p-4 text-base text-ink leading-relaxed font-serif"
                placeholder="Paste or scan your text here..."
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
