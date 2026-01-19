import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '../../lib/utils';

interface WordDetailsProps {
  surface: string;
  normalized: string;
  currentStatus: number; // 0..4 or 99
  onUpdateStatus: (status: number) => void;
  onClose: () => void;
}

export function WordDetails({
  surface,
  normalized,
  currentStatus,
  onUpdateStatus,
  onClose,
}: WordDetailsProps) {
  const statusOptions = [
    {
      value: 0,
      label: 'New',
      desc: 'Never seen',
      icon: 'sparkles-outline',
      activeIcon: 'sparkles',
      color: '#d97706', // amber-600
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    },
    {
      value: 1,
      label: 'Learning',
      desc: 'Recognize',
      icon: 'book-outline',
      activeIcon: 'book',
      color: '#2563eb', // blue-600
      bg: 'bg-blue-50',
      border: 'border-blue-200',
    },
    {
      value: 3,
      label: 'Familiar',
      desc: 'Almost known',
      icon: 'star-outline',
      activeIcon: 'star',
      color: '#4f46e5', // indigo-600
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
    },
    {
      value: 4,
      label: 'Known',
      desc: 'Mastered',
      icon: 'checkmark-circle-outline',
      activeIcon: 'checkmark-circle',
      color: '#047857', // success
      bg: 'bg-successSoft',
      border: 'border-success/20',
    },
  ];

  return (
    <View className="absolute bottom-0 left-0 right-0 md:left-auto md:right-8 md:bottom-24 md:w-[380px] md:rounded-2xl bg-white shadow-pop border-t md:border border-border/50 overflow-hidden">
      {/* Header Area */}
      <View className="p-6 pb-4">
        <View className="flex-row justify-between items-start">
          <View className="flex-1 pr-4">
            <Text className="text-3xl font-bold text-ink tracking-tight">
              {surface}
            </Text>
            {surface.toLowerCase() !== normalized.toLowerCase() && (
              <Text className="text-sm text-faint mt-0.5 font-medium italic">
                {normalized}
              </Text>
            )}
          </View>
          <Pressable
            onPress={onClose}
            className="h-8 w-8 items-center justify-center rounded-full bg-muted active:bg-border"
            hitSlop={20}
          >
            <Ionicons name="close" size={18} color="#4b5563" />
          </Pressable>
        </View>
      </View>

      {/* Dictionary Section */}
      <View className="px-6 py-4 bg-canvas/50 border-y border-border/30">
        <View className="flex-row items-center mb-2 opacity-50">
          <Ionicons name="search-outline" size={14} color="#4b5563" />
          <Text className="text-[10px] font-bold uppercase tracking-widest text-subink ml-1.5">
            Wiktionary Definition
          </Text>
        </View>
        <Text className="text-sm text-subink leading-5 italic">
          Definition lookup is currently unavailable in offline mode.
        </Text>
      </View>

      {/* Status Selection Grid */}
      <View className="p-6">
        <Text className="text-[10px] font-bold uppercase tracking-widest text-faint mb-4">
          Set Word Status
        </Text>
        <View className="flex-row flex-wrap gap-3">
          {statusOptions.map((opt) => {
            const isActive = currentStatus === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => onUpdateStatus(opt.value)}
                className={cn(
                  'flex-1 min-w-[140px] p-3 rounded-xl border',
                  isActive
                    ? `${opt.bg} ${opt.border}`
                    : 'bg-white border-border active:bg-muted'
                )}
              >
                <View className="flex-row items-center">
                  <View
                    className={cn(
                      'w-8 h-8 rounded-lg items-center justify-center mr-3',
                      isActive ? 'bg-white/50' : 'bg-canvas'
                    )}
                  >
                    <Ionicons
                      name={(isActive ? opt.activeIcon : opt.icon) as any}
                      size={18}
                      color={isActive ? opt.color : '#6b7280'}
                    />
                  </View>
                  <View>
                    <Text
                      className={cn(
                        'text-sm font-bold',
                        isActive ? 'text-ink' : 'text-subink'
                      )}
                    >
                      {opt.label}
                    </Text>
                    <Text className="text-[10px] text-faint font-medium">
                      {opt.desc}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Action Bar */}
        <View className="mt-6 pt-5 border-t border-border/50 flex-row justify-between items-center">
          <Pressable
            onPress={() => onUpdateStatus(99)}
            className={cn(
              'flex-row items-center px-3 py-1.5 rounded-lg',
              currentStatus === 99 ? 'bg-gray-100' : 'active:bg-gray-50'
            )}
          >
            <Ionicons
              name="eye-off-outline"
              size={14}
              color={currentStatus === 99 ? '#111827' : '#6b7280'}
            />
            <Text
              className={cn(
                'text-xs font-semibold ml-2',
                currentStatus === 99 ? 'text-ink' : 'text-faint'
              )}
            >
              Ignore Word
            </Text>
          </Pressable>

          <Pressable
            onPress={onClose}
            className="bg-ink px-6 py-2 rounded-full active:opacity-90"
          >
            <Text className="text-white text-xs font-bold">Done</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
