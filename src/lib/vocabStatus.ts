export const STATUS_NEW = 0;
export const STATUS_LEARNING_1 = 1;
export const STATUS_LEARNING_2 = 2;
export const STATUS_LEARNING_3 = 3;
export const STATUS_KNOWN = 4;

export const STATUS_OPTIONS = [
  { value: STATUS_NEW, label: 'New', color: 'blue' },
  { value: STATUS_LEARNING_1, label: 'Recognized', color: 'amber-light' },
  { value: STATUS_LEARNING_2, label: 'Learning', color: 'amber-medium' },
  { value: STATUS_LEARNING_3, label: 'Familiar', color: 'amber-dark' },
  { value: STATUS_KNOWN, label: 'Known', color: 'emerald' },
] as const;

export type VocabStatus = (typeof STATUS_OPTIONS)[number]['value'];

export function getStatusLabel(status: VocabStatus): string {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label ?? 'Unknown';
}

export type StatusColor = 'blue' | 'amber-light' | 'amber-medium' | 'amber-dark' | 'emerald';

export function getStatusColor(status: VocabStatus): StatusColor {
  const option = STATUS_OPTIONS.find((s) => s.value === status);
  return (option?.color as StatusColor) ?? 'blue';
}
