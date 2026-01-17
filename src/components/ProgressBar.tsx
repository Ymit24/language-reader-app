import { View } from 'react-native';

interface ProgressBarProps {
  progress: number;
  className?: string;
  color?: 'success' | 'brand';
}

export function ProgressBar({ progress, className = '', color = 'brand' }: ProgressBarProps) {
  const colorClass = color === 'success' ? 'bg-success' : 'bg-brand';
  
  return (
    <View className={`h-1.5 w-full rounded bg-border ${className}`}>
      <View
        className={`h-1.5 rounded ${colorClass}`}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </View>
  );
}
