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
    { value: 1, label: '1', color: 'bg-amber-100 border-amber-200', activeColor: 'bg-amber-400 border-amber-500' },
    { value: 2, label: '2', color: 'bg-amber-100 border-amber-200', activeColor: 'bg-amber-400 border-amber-500' },
    { value: 3, label: '3', color: 'bg-amber-100 border-amber-200', activeColor: 'bg-amber-400 border-amber-500' },
    { value: 4, label: 'Known', icon: 'checkmark', color: 'bg-white border-gray-200', activeColor: 'bg-green-100 border-green-400' },
  ];

  return (
    <View className="absolute bottom-0 left-0 right-0 md:left-auto md:right-8 md:bottom-8 md:w-[400px] md:rounded-2xl bg-white/95 backdrop-blur-xl border-t md:border border-gray-200/50 shadow-2xl p-6">
      {/* Header */}
      <View className="flex-row justify-between items-start mb-4">
        <View>
          <Text className="text-4xl font-serif font-medium text-ink tracking-tight">{surface}</Text>
          {/* <Text className="text-sm text-subink mt-1 uppercase tracking-wider font-semibold opacity-60">Normalized: {normalized}</Text> */}
        </View>
        <Pressable 
          onPress={onClose} 
          className="bg-gray-100 p-2 rounded-full active:bg-gray-200"
          hitSlop={10}
        >
          <Ionicons name="close" size={20} color="#666" />
        </Pressable>
      </View>

      {/* Dictionary Placeholder - styled nicely */}
      <View className="mb-8">
        <View className="flex-row items-baseline mb-2">
            <Text className="text-lg font-semibold text-ink mr-2">Definition</Text>
            <Text className="text-sm text-subink">(Wiktionary)</Text>
        </View>
        <Text className="text-lg text-ink/80 leading-7 font-serif">
           Definition not available in offline mode.
        </Text>
      </View>

      {/* Status Actions */}
      <View className="flex-row gap-3">
        {/* Ignore Button */}
        <Pressable
          onPress={() => onUpdateStatus(99)}
          className={cn(
            "w-14 items-center justify-center p-3 rounded-xl border",
            currentStatus === 99 ? "bg-gray-200 border-gray-300" : "bg-white border-gray-200"
          )}
        >
          <Ionicons name="eye-off-outline" size={22} color={currentStatus === 99 ? "#000" : "#999"} />
        </Pressable>

        {/* Status Buttons */}
        <View className="flex-1 flex-row gap-2">
            {statusOptions.map((opt) => (
            <Pressable
                key={opt.value}
                onPress={() => onUpdateStatus(opt.value)}
                className={cn(
                "flex-1 items-center justify-center py-3 rounded-xl border",
                currentStatus === opt.value ? opt.activeColor : `bg-white ${opt.color.split(' ').find(c => c.startsWith('border')) || 'border-transparent'}`
                )}
                style={{
                    backgroundColor: currentStatus === opt.value ? undefined : (opt.value === 4 ? '#fff' : '#fffbeb') // Fallback for complex class logic
                }}
            >
                {opt.icon ? (
                <Ionicons name={opt.icon as any} size={24} color={currentStatus === opt.value ? "#15803d" : "#000"} />
                ) : (
                <Text className={cn("text-lg font-bold", currentStatus === opt.value ? "text-amber-900" : "text-amber-700/70")}>{opt.label}</Text>
                )}
            </Pressable>
            ))}
        </View>
      </View>
    </View>
  );
}
