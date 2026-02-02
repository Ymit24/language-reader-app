import React from 'react';
import { Pressable, View } from 'react-native';
import { cn } from '@/src/lib/utils';
import { WordDetails } from './WordDetails';

const INSPECTOR_WIDTH = 360;

interface ReaderInspectorProps {
  isVisible: boolean;
  isLargeScreen: boolean;
  surface: string;
  normalized: string;
  language: 'de' | 'fr' | 'ja';
  currentStatus: number;
  isUpdating: boolean;
  onUpdateStatus: (status: number) => Promise<void>;
  onClose: () => void;
}

export function ReaderInspector({
  isVisible,
  isLargeScreen,
  surface,
  normalized,
  language,
  currentStatus,
  isUpdating,
  onUpdateStatus,
  onClose,
}: ReaderInspectorProps) {
  if (!isVisible) return null;

  return (
    <View
      className={cn(
        'absolute inset-0',
        isLargeScreen ? 'items-end' : 'justify-end'
      )}
    >
      <Pressable
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.35)' }}
        onPress={onClose}
      />
      {isLargeScreen ? (
        <View
          className="bg-panel h-full border-l border-border/70"
          style={{ width: INSPECTOR_WIDTH }}
        >
          <WordDetails
            mode="sidebar"
            surface={surface}
            normalized={normalized}
            language={language}
            currentStatus={currentStatus}
            isUpdating={isUpdating}
            onUpdateStatus={onUpdateStatus}
            onClose={onClose}
          />
        </View>
      ) : (
        <WordDetails
          mode="popup"
          surface={surface}
          normalized={normalized}
          language={language}
          currentStatus={currentStatus}
          isUpdating={isUpdating}
          onUpdateStatus={onUpdateStatus}
          onClose={onClose}
        />
      )}
    </View>
  );
}
