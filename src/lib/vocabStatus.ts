import type { ThemeColors } from '@/src/theme/AppThemeProvider';

export type VocabStatus = 0 | 1 | 2 | 3 | 4;
export type VocabStatusGroup = 'new' | 'learning' | 'familiar' | 'known';

export type StatusOption = {
  value: VocabStatus;
  group: VocabStatusGroup;
  label: string;
  description: string;
  icon: string;
  activeIcon: string;
};

type StatusTheme = {
  label: string;
  lineVar: keyof ThemeColors;
  badgeBgClass: string;
  badgeTextClass: string;
  softBgClass: string;
  activeBgClass: string;
  borderClass: string;
};

export const STATUS_GROUP_BY_VALUE: Record<VocabStatus, VocabStatusGroup> = {
  0: 'new',
  1: 'learning',
  2: 'learning',
  3: 'familiar',
  4: 'known',
};

export const STATUS_OPTIONS: StatusOption[] = [
  {
    value: 0,
    group: 'new',
    label: 'New',
    description: 'Never seen',
    icon: 'sparkles-outline',
    activeIcon: 'sparkles',
  },
  {
    value: 1,
    group: 'learning',
    label: 'Learning',
    description: 'Recognize',
    icon: 'book-outline',
    activeIcon: 'book',
  },
  {
    value: 3,
    group: 'familiar',
    label: 'Familiar',
    description: 'Almost known',
    icon: 'star-outline',
    activeIcon: 'star',
  },
  {
    value: 4,
    group: 'known',
    label: 'Known',
    description: 'Mastered',
    icon: 'checkmark-circle-outline',
    activeIcon: 'checkmark-circle',
  },
];

export const STATUS_THEME_BY_GROUP: Record<VocabStatusGroup, StatusTheme> = {
  new: {
    label: 'New',
    lineVar: '--vUnknownLine',
    badgeBgClass: 'bg-vUnknownBg',
    badgeTextClass: 'text-vUnknownLine',
    softBgClass: 'bg-vUnknownBg/50',
    activeBgClass: 'bg-vUnknownLine/15',
    borderClass: 'border-vUnknownLine/30',
  },
  learning: {
    label: 'Learning',
    lineVar: '--vLearningLine',
    badgeBgClass: 'bg-vLearningBg',
    badgeTextClass: 'text-vLearningLine',
    softBgClass: 'bg-vLearningBg/50',
    activeBgClass: 'bg-vLearningLine/15',
    borderClass: 'border-vLearningLine/30',
  },
  familiar: {
    label: 'Familiar',
    lineVar: '--vFamiliarLine',
    badgeBgClass: 'bg-vFamiliarBg',
    badgeTextClass: 'text-vFamiliarLine',
    softBgClass: 'bg-vFamiliarBg/50',
    activeBgClass: 'bg-vFamiliarLine/15',
    borderClass: 'border-vFamiliarLine/30',
  },
  known: {
    label: 'Known',
    lineVar: '--vKnownLine',
    badgeBgClass: 'bg-vKnownBg',
    badgeTextClass: 'text-vKnownLine',
    softBgClass: 'bg-vKnownBg/50',
    activeBgClass: 'bg-vKnownLine/15',
    borderClass: 'border-vKnownLine/30',
  },
};

export const STATUS_FILTER_OPTIONS: {
  status: VocabStatus | null;
  label: string;
  countKey: 'total' | 'new' | 'recognized' | 'learning' | 'familiar' | 'known';
}[] = [
  { status: null, label: 'All', countKey: 'total' },
  { status: 0, label: 'New', countKey: 'new' },
  { status: 1, label: 'Learning', countKey: 'learning' },
  { status: 3, label: 'Familiar', countKey: 'familiar' },
  { status: 4, label: 'Known', countKey: 'known' },
];

export const getStatusGroup = (
  status: number | null | undefined
): VocabStatusGroup => {
  if (status === null || status === undefined) return 'new';
  return STATUS_GROUP_BY_VALUE[status as VocabStatus] ?? 'new';
};

export const getStatusOption = (
  status: number | null | undefined
): StatusOption => {
  const group = getStatusGroup(status);
  return STATUS_OPTIONS.find((option) => option.group === group) ?? STATUS_OPTIONS[0];
};

export const getStatusTheme = (
  status: number | null | undefined
): StatusTheme => STATUS_THEME_BY_GROUP[getStatusGroup(status)];

export const getStatusLabel = (status: number | null | undefined): string =>
  getStatusTheme(status).label;

export const getStatusColor = (
  status: number | null | undefined,
  colors: ThemeColors
): string => {
  const theme = getStatusTheme(status);
  return colors[theme.lineVar];
};

export const isLearningStatus = (status: number | null | undefined): boolean =>
  getStatusGroup(status) === 'learning';
