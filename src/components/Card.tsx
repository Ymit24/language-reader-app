import { View, Text, Pressable, PressableProps } from 'react-native';
import { ProgressBar } from './ProgressBar';
import { StackedProgressBar, type VocabCounts } from './StackedProgressBar';
import { CompletedBadge } from './CompletedBadge';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <View className={`rounded-md border border-border bg-panel ${className}`}>
      {children}
    </View>
  );
}

// ------------------------------------------------------------------

function LanguageThumbnail({ language, variant }: { language: string, variant: 'list' | 'grid' }) {
  const colors: Record<string, string> = {
    DE: 'bg-vUnknownBg text-vUnknownLine',
    FR: 'bg-vLearningBg text-brand',
    JA: 'bg-dangerSoft text-danger',
  };
  
  const style = colors[language] || 'bg-muted text-subink';
  const [bgClass, textClass] = style.split(' ');

  if (variant === 'list') {
    return (
      <View className={`h-12 w-12 items-center justify-center rounded-md ${bgClass}`}>
        <Text className={`text-xs font-bold ${textClass}`}>{language}</Text>
      </View>
    );
  }

  return (
    <View className={`h-24 w-full items-center justify-center rounded-t-md ${bgClass}`}>
      <Text className={`text-2xl font-bold ${textClass}`}>{language}</Text>
    </View>
  );
}

interface LessonCardProps extends PressableProps {
  title: string;
  language: string;
  duration: string;
  openedDate: string;
  vocabCounts?: VocabCounts;
  readingPercentage?: number;
  variant?: 'list' | 'grid';
  isCompleted?: boolean;
}

export function LessonCard({
  title,
  language,
  duration,
  openedDate,
  vocabCounts,
  readingPercentage,
  variant = 'list',
  isCompleted = false,
  className = '',
  ...props
}: LessonCardProps) {
  const cardBackground = isCompleted ? 'bg-muted' : 'bg-panel';

  if (variant === 'grid') {
    return (
      <Pressable
        className={`flex-1 rounded-lg border border-border ${cardBackground} active:opacity-90 ${className}`}
        style={{ overflow: 'hidden' }}
        {...props}
      >
        <View className="relative">
          <LanguageThumbnail language={language} variant="grid" />
          {isCompleted && (
            <View className="absolute top-3 right-3">
              <CompletedBadge />
            </View>
          )}
        </View>
        
        <View className="p-4 gap-3 flex-1">
          <View>
            <Text className="text-base font-semibold text-ink leading-tight" numberOfLines={2}>
              {title}
            </Text>
            <Text className="mt-1 text-xs text-faint">
              {duration} · {openedDate}
            </Text>
            {isCompleted && (
              <Text className="mt-1 text-xs text-green-600 font-medium">Completed</Text>
            )}
          </View>
          
          <View className="mt-auto gap-2">
            {readingPercentage !== undefined && (
              <ProgressBar
                progress={readingPercentage}
                color="neutral"
                height={4}
              />
            )}
            {vocabCounts && (
              <StackedProgressBar
                counts={vocabCounts}
                showLegend={false}
                height={4}
              />
            )}
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      className={`rounded-lg border border-border ${cardBackground} p-3 active:bg-muted ${className}`}
      {...props}
    >
      <View className="flex-row gap-3 items-center">
        <LanguageThumbnail language={language} variant="list" />

        <View className="flex-1 justify-between">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-2">
              <Text className="text-base font-semibold text-ink leading-tight" numberOfLines={1}>
                {title}
              </Text>
              <Text className="mt-0.5 text-xs text-faint">
                {duration} · {openedDate}
              </Text>
              {isCompleted && (
                <Text className="mt-1 text-xs text-vKnownLine font-medium">Completed</Text>
              )}
            </View>
            {isCompleted && <CompletedBadge />}
          </View>
          
          <View className="mt-2 gap-2">
            {readingPercentage !== undefined && (
              <ProgressBar
                progress={readingPercentage}
                color="neutral"
                height={4}
              />
            )}
            {vocabCounts && (
              <StackedProgressBar
                counts={vocabCounts}
                showLegend={false}
                height={4}
              />
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-4 py-12">
      <Text className="text-center text-lg font-semibold text-ink">{title}</Text>
      <Text className="mt-2 text-center text-sm text-subink">{description}</Text>
      {action && <View className="mt-4">{action}</View>}
    </View>
  );
}
