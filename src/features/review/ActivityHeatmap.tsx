import React, { useMemo } from 'react';
import { View, Text } from 'react-native';

interface DailyStats {
  date: string;
  reviewCount: number;
  correctCount: number;
  xpEarned: number;
  minutesSpent: number;
}

interface ActivityHeatmapProps {
  dailyStats: DailyStats[];
  days?: number;
  isLoading?: boolean;
}

// Intensity levels based on review count
function getIntensityLevel(count: number): number {
  if (count === 0) return 0;
  if (count <= 5) return 1;
  if (count <= 15) return 2;
  if (count <= 30) return 3;
  return 4;
}

// Color classes for each intensity level
const intensityColors: Record<number, string> = {
  0: 'bg-muted',
  1: 'bg-successSoft',
  2: 'bg-success/40',
  3: 'bg-success/70',
  4: 'bg-success',
};

// Generate date strings for the last N days
function generateDateRange(days: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
}

// Get day of week (0 = Sunday, 6 = Saturday)
function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr).getDay();
}

// Get month label for a date
function getMonthLabel(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short' });
}

export function ActivityHeatmap({
  dailyStats,
  days = 91, // 13 weeks
  isLoading = false,
}: ActivityHeatmapProps) {
  const { grid, monthLabels, totalReviews, activeDays } = useMemo(() => {
    const dates = generateDateRange(days);
    const statsMap = new Map(dailyStats.map(s => [s.date, s]));
    
    // Build grid (7 rows for days of week, columns for weeks)
    const weeks: { date: string; count: number }[][] = [];
    let currentWeek: { date: string; count: number }[] = [];
    
    // Add empty cells for days before the first date's day of week
    const firstDayOfWeek = getDayOfWeek(dates[0]);
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({ date: '', count: -1 }); // -1 = empty placeholder
    }
    
    dates.forEach(date => {
      const dayOfWeek = getDayOfWeek(date);
      
      // Start new week on Sunday
      if (dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      
      const stats = statsMap.get(date);
      currentWeek.push({
        date,
        count: stats?.reviewCount ?? 0,
      });
    });
    
    // Push the last partial week
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
    
    // Calculate month labels (show month when it changes)
    const labels: { weekIndex: number; label: string }[] = [];
    let lastMonth = '';
    
    weeks.forEach((week, weekIndex) => {
      const firstValidDay = week.find(d => d.date);
      if (firstValidDay) {
        const month = getMonthLabel(firstValidDay.date);
        if (month !== lastMonth) {
          labels.push({ weekIndex, label: month });
          lastMonth = month;
        }
      }
    });
    
    // Calculate totals
    let total = 0;
    let active = 0;
    dates.forEach(date => {
      const stats = statsMap.get(date);
      if (stats) {
        total += stats.reviewCount;
        if (stats.reviewCount > 0) active++;
      }
    });
    
    return {
      grid: weeks,
      monthLabels: labels,
      totalReviews: total,
      activeDays: active,
    };
  }, [dailyStats, days]);

  if (isLoading) {
    return (
      <View className="rounded-2xl border border-border/80 bg-panel p-5">
        <View className="h-4 w-32 rounded bg-muted mb-4" />
        <View className="h-24 rounded bg-muted animate-pulse" />
      </View>
    );
  }

  return (
    <View className="rounded-2xl border border-border/80 bg-panel p-5">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-base font-sans-bold text-ink">Activity</Text>
        <Text className="text-xs text-faint font-sans-medium">
          {activeDays} active days
        </Text>
      </View>

      {/* Month labels */}
      <View className="flex-row mb-1 ml-6">
        {grid.map((_, weekIndex) => {
          const label = monthLabels.find(l => l.weekIndex === weekIndex);
          return (
            <View key={weekIndex} className="w-3 mx-0.5">
              {label && (
                <Text className="text-[9px] text-faint font-sans-medium">
                  {label.label}
                </Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Heatmap grid */}
      <View className="flex-row">
        {/* Day labels */}
        <View className="w-6 mr-1">
          <View className="h-3 mb-0.5" />
          <Text className="h-3 text-[9px] text-faint font-sans-medium">Mon</Text>
          <View className="h-3 mb-0.5" />
          <Text className="h-3 text-[9px] text-faint font-sans-medium">Wed</Text>
          <View className="h-3 mb-0.5" />
          <Text className="h-3 text-[9px] text-faint font-sans-medium">Fri</Text>
          <View className="h-3 mb-0.5" />
        </View>

        {/* Grid */}
        <View className="flex-row flex-1">
          {grid.map((week, weekIndex) => (
            <View key={weekIndex} className="mx-0.5">
              {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => {
                const day = week[dayIndex];
                
                if (!day || day.count === -1) {
                  return (
                    <View 
                      key={dayIndex} 
                      className="w-3 h-3 mb-0.5 rounded-sm"
                    />
                  );
                }

                const intensity = getIntensityLevel(day.count);
                const colorClass = intensityColors[intensity];

                return (
                  <View
                    key={dayIndex}
                    className={`w-3 h-3 mb-0.5 rounded-sm ${colorClass}`}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* Legend */}
      <View className="flex-row items-center justify-end mt-3 gap-1">
        <Text className="text-[9px] text-faint font-sans-medium mr-1">Less</Text>
        {[0, 1, 2, 3, 4].map(level => (
          <View
            key={level}
            className={`w-3 h-3 rounded-sm ${intensityColors[level]}`}
          />
        ))}
        <Text className="text-[9px] text-faint font-sans-medium ml-1">More</Text>
      </View>

      {/* Summary */}
      <View className="flex-row items-center justify-center mt-4 pt-3 border-t border-border/50">
        <Text className="text-sm text-subink font-sans-medium">
          <Text className="font-sans-bold text-ink">{totalReviews}</Text>
          {' '}reviews in the last {days} days
        </Text>
      </View>
    </View>
  );
}
