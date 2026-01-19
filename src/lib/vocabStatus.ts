export const STATUS_NEW = 0;
export const STATUS_LEARNING_1 = 1;
export const STATUS_LEARNING_2 = 2;
export const STATUS_LEARNING_3 = 3;
export const STATUS_KNOWN = 4;

export const STATUS_OPTIONS = [
  { value: STATUS_NEW, label: 'New', color: 'blue' },
  { value: STATUS_LEARNING_1, label: 'Recognized', color: 'amber' },
  { value: STATUS_LEARNING_2, label: 'Learning', color: 'amber' },
  { value: STATUS_LEARNING_3, label: 'Familiar', color: 'amber' },
  { value: STATUS_KNOWN, label: 'Known', color: 'emerald' },
] as const;

export type VocabStatus = (typeof STATUS_OPTIONS)[number]['value'];

export function getStatusLabel(status: VocabStatus): string {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label ?? 'Unknown';
}

export function getStatusColor(status: VocabStatus): 'blue' | 'amber' | 'emerald' {
  return STATUS_OPTIONS.find((s) => s.value === status)?.color ?? 'blue';
}
