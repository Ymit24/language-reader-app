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
    <View className={`rounded-xl border border-border/80 bg-panel shadow-card ${className}`}>
      {children}
    </View>
  );
}

// ------------------------------------------------------------------

function LanguagePill({ language }: { language: string }) {
  const colors: Record<string, string> = {
    DE: 'bg-[#f4e6cf] text-[#7a4f1f]',
    FR: 'bg-[#e3edf6] text-[#2c5b7a]',
    JA: 'bg-[#f4e3df] text-[#7a3f34]',
  };

  const style = colors[language] || 'bg-muted text-subink';
  const [bgClass, textClass] = style.split(' ');

  return (
    <View className={`px-2.5 py-1 rounded-full ${bgClass}`}>
      <Text className={`text-[11px] font-sans-semibold uppercase tracking-wide ${textClass}`}>
        {language}
      </Text>
    </View>
  );
}

function LanguageAccent({ language }: { language: string }) {
  const accents: Record<string, string> = {
    DE: 'bg-[#d7b98a]',
    FR: 'bg-[#9bbbd2]',
    JA: 'bg-[#d2a39b]',
  };

  return <View className={`h-1.5 w-full ${accents[language] || 'bg-border2'}`} />;
}

interface LessonCardProps extends PressableProps {
  title: string;
  language: string;
  duration: string;
  openedDate: string;
  vocabCounts?: VocabCounts;
  readingPercentage?: number;
  variant?: 'list' | 'grid' | 'feature';
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
  const cardBackground = isCompleted ? 'bg-muted/60' : 'bg-panel';
  const titleStyle = variant === 'feature' ? 'text-xl md:text-2xl' : 'text-base';
  const paddingStyle = variant === 'feature' ? 'p-5 md:p-6' : 'p-4';
  const progressLabel = readingPercentage === undefined
    ? 'New'
    : `${Math.round(readingPercentage)}% read`;

  return (
    <Pressable
      className={`rounded-2xl border border-border/80 ${cardBackground} shadow-card active:opacity-90 ${className}`}
      style={{ overflow: 'hidden' }}
      {...props}
    >
      <LanguageAccent language={language} />
      <View className={`${paddingStyle} gap-3`}>
        <View className="flex-row items-center justify-between">
          <LanguagePill language={language} />
          {isCompleted ? (
            <View className="flex-row items-center gap-2">
              <Text className="text-xs text-success font-sans-semibold">Completed</Text>
              <CompletedBadge />
            </View>
          ) : (
            <Text className="text-xs text-subink font-sans-semibold">{progressLabel}</Text>
          )}
        </View>

        <View className="gap-1">
          <Text
            className={`${titleStyle} font-serif-semibold text-ink leading-tight`}
            numberOfLines={variant === 'feature' ? 3 : 2}
          >
            {title}
          </Text>
          <Text className="text-xs text-faint font-sans-medium">
            {duration} · {openedDate}
          </Text>
        </View>

        <View className="gap-2">
          {readingPercentage !== undefined && (
            <ProgressBar
              progress={readingPercentage}
              color={isCompleted ? 'success' : 'brand'}
              height={variant === 'feature' ? 8 : 6}
              showLabel={variant === 'feature'}
              label="Reading"
            />
          )}
          {vocabCounts && (
            <StackedProgressBar
              counts={vocabCounts}
              showLegend={variant === 'feature'}
              height={variant === 'feature' ? 6 : 4}
            />
          )}
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
      <Text className="text-center text-lg font-sans-semibold text-ink">{title}</Text>
      <Text className="mt-2 text-center text-sm text-subink font-sans-medium">{description}</Text>
      {action && <View className="mt-4">{action}</View>}
    </View>
  );
}
