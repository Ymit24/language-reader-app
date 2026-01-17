import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '../../lib/utils';
import { TokenStatus } from './Token';

interface WordDetailsProps {
  surface: string;
  normalized: string;
  currentStatus: number; // 0..4 or 99
  onUpdateStatus: (status: number) => void;
  onClose: () => void;
}

export function WordDetails({ surface, normalized, currentStatus, onUpdateStatus, onClose }: WordDetailsProps) {
  const statusOptions = [
    { value: 1, label: '1', color: 'bg-yellow-100', activeColor: 'bg-yellow-400' },
    { value: 2, label: '2', color: 'bg-yellow-100', activeColor: 'bg-yellow-400' },
    { value: 3, label: '3', color: 'bg-yellow-100', activeColor: 'bg-yellow-400' },
    { value: 4, label: 'Known', icon: 'checkmark', color: 'bg-white border border-gray-200', activeColor: 'bg-green-100 border-green-300' },
  ];

  return (
    <View className="absolute bottom-0 left-0 right-0 md:left-[10%] md:right-[10%] md:bottom-6 md:rounded-xl bg-white border-t md:border border-gray-200 shadow-lg p-4 pb-8 md:pb-6">
      {/* Header */}
      <View className="flex-row justify-between items-start mb-4">
        <View>
          <Text className="text-3xl font-serif text-ink">{surface}</Text>
          <Text className="text-sm text-subink mt-1">Normalized: {normalized}</Text>
        </View>
        <Pressable onPress={onClose} className="p-2 -mr-2">
          <Ionicons name="close" size={24} color="#666" />
        </Pressable>
      </View>

      {/* Dictionary Placeholder */}
      <View className="mb-6 bg-gray-50 p-4 rounded-md min-h-[100px]">
        <Text className="text-subink italic">
          Dictionary definition for "{surface}" would appear here.
        </Text>
      </View>

      {/* Status Actions */}
      <View className="flex-row gap-3">
        {/* Ignore Button */}
        <Pressable
          onPress={() => onUpdateStatus(99)}
          className={cn(
            "flex-1 items-center justify-center p-3 rounded-md",
            currentStatus === 99 ? "bg-gray-200" : "bg-white border border-gray-200"
          )}
        >
          <Ionicons name="trash-outline" size={20} color={currentStatus === 99 ? "#000" : "#666"} />
          <Text className="text-xs mt-1 text-subink">Ignore</Text>
        </Pressable>

        {/* Status Buttons */}
        {statusOptions.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => onUpdateStatus(opt.value)}
            className={cn(
              "flex-1 items-center justify-center p-3 rounded-md",
              currentStatus === opt.value ? opt.activeColor : opt.color
            )}
          >
            {opt.icon ? (
              <Ionicons name={opt.icon as any} size={20} color="#000" />
            ) : (
              <Text className="text-lg font-bold">{opt.label}</Text>
            )}
            {opt.value === 4 && <Text className="text-xs mt-1 text-subink">Known</Text>}
          </Pressable>
        ))}
      </View>
    </View>
  );
}
