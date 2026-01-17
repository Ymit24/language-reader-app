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

interface LessonCardProps extends PressableProps {
  title: string;
  language: string;
  duration: string;
  openedDate: string;
  knownPercentage: number;
  onMenuPress?: () => void;
}

export function LessonCard({
  title,
  language,
  duration,
  openedDate,
  knownPercentage,
  onMenuPress,
  className = '',
  ...props
}: LessonCardProps) {
  return (
    <Pressable
      className={`rounded-md border border-border bg-panel p-4 active:bg-muted ${className}`}
      {...props}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-ink">{title}</Text>
          <Text className="mt-1 text-xs text-faint">
            {language} · {duration} · opened {openedDate}
          </Text>
        </View>
        <Pressable
          onPress={onMenuPress}
          className="rounded-md px-2 py-1 active:bg-panel"
          accessibilityLabel="More options"
        >
          <Text className="text-sm text-subink">⋯</Text>
        </Pressable>
      </View>

      <View className="mt-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-subink">Known</Text>
          <Text className="text-xs text-subink tabular-nums">{knownPercentage}%</Text>
        </View>
        <View className="mt-2 h-1.5 w-full rounded bg-border">
          <View
            className={`h-1.5 rounded ${knownPercentage >= 50 ? 'bg-success' : 'bg-brand'}`}
            style={{ width: `${knownPercentage}%` }}
          />
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
