import { View, Text, Pressable, PressableProps } from 'react-native';

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
  // Simple color mapping
  const colors: Record<string, string> = {
    DE: 'bg-yellow-100 text-yellow-800',
    FR: 'bg-blue-100 text-blue-800',
    JA: 'bg-red-100 text-red-800',
  };
  
  const style = colors[language] || 'bg-gray-100 text-gray-800';
  const [bgClass, textClass] = style.split(' ');

  if (variant === 'list') {
    return (
      <View className={`h-12 w-12 items-center justify-center rounded-md ${bgClass}`}>
        <Text className={`text-xs font-bold ${textClass}`}>{language}</Text>
      </View>
    );
  }

  // Grid variant (larger)
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
  knownPercentage: number;
  variant?: 'list' | 'grid';
}

export function LessonCard({
  title,
  language,
  duration,
  openedDate,
  knownPercentage,
  variant = 'list',
  className = '',
  ...props
}: LessonCardProps) {
  // Common Progress Bar
  const ProgressBar = () => (
    <View className="mt-auto">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs text-subink">Known</Text>
        <Text className="text-xs text-subink tabular-nums">{knownPercentage}%</Text>
      </View>
      <View className="mt-1.5 h-1.5 w-full rounded-full bg-border">
        <View
          className={`h-1.5 rounded-full ${knownPercentage >= 50 ? 'bg-success' : 'bg-brand'}`}
          style={{ width: `${knownPercentage}%` }}
        />
      </View>
    </View>
  );

  if (variant === 'grid') {
    return (
      <Pressable
        className={`flex-1 rounded-lg border border-border bg-panel active:opacity-90 ${className}`}
        style={{ overflow: 'hidden' }} // Ensure thumbnail corners clip
        {...props}
      >
        {/* Top: Thumbnail */}
        <LanguageThumbnail language={language} variant="grid" />
        
        {/* Bottom: Content */}
        <View className="p-4 gap-3 flex-1">
          <View>
            <Text className="text-base font-semibold text-ink leading-tight" numberOfLines={2}>
              {title}
            </Text>
            <Text className="mt-1 text-xs text-faint">
              {duration} · {openedDate}
            </Text>
          </View>
          
          <ProgressBar />
        </View>
      </Pressable>
    );
  }

  // List Variant (Default)
  return (
    <Pressable
      className={`rounded-lg border border-border bg-panel p-3 active:bg-muted ${className}`}
      {...props}
    >
      <View className="flex-row gap-3">
        {/* Left: Thumbnail */}
        <LanguageThumbnail language={language} variant="list" />

        {/* Right: Content */}
        <View className="flex-1 justify-between">
          <View>
            <Text className="text-base font-semibold text-ink leading-tight" numberOfLines={1}>
              {title}
            </Text>
            <Text className="mt-0.5 text-xs text-faint">
              {duration} · {openedDate}
            </Text>
          </View>
          
          <View className="mt-2">
            <ProgressBar />
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
