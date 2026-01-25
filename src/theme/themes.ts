export type ThemeMode = 'light' | 'dark';

export type ThemeId = 'sand' | 'paper' | 'midnight' | 'slate';

export type ThemePreference = ThemeId | 'system';

export type ThemeVariable =
  | '--canvas'
  | '--panel'
  | '--muted'
  | '--ink'
  | '--subink'
  | '--faint'
  | '--border'
  | '--border2'
  | '--brand'
  | '--brandSoft'
  | '--accent'
  | '--danger'
  | '--dangerSoft'
  | '--success'
  | '--successSoft'
  | '--vUnknownBg'
  | '--vUnknownLine'
  | '--vLearningBg'
  | '--vLearningLine'
  | '--vFamiliarBg'
  | '--vFamiliarLine'
  | '--vKnownBg'
  | '--vKnownLine';

export type ThemeDefinition = {
  id: ThemeId;
  label: string;
  mode: ThemeMode;
  variables: Record<ThemeVariable, string>;
};

export const DEFAULT_THEME_ID: ThemeId = 'sand';
export const DEFAULT_DARK_THEME_ID: ThemeId = 'midnight';

export const THEMES: ThemeDefinition[] = [
  {
    id: 'sand',
    label: 'Sandstone',
    mode: 'light',
    variables: {
      '--canvas': '246 242 234',
      '--panel': '255 253 248',
      '--muted': '240 235 225',
      '--ink': '31 26 23',
      '--subink': '82 74 67',
      '--faint': '128 119 110',
      '--border': '225 215 201',
      '--border2': '205 191 175',
      '--brand': '47 107 102',
      '--brandSoft': '228 241 239',
      '--accent': '181 106 44',
      '--danger': '180 35 24',
      '--dangerSoft': '253 238 238',
      '--success': '29 107 79',
      '--successSoft': '232 245 239',
      '--vUnknownBg': '253 241 225',
      '--vUnknownLine': '208 139 53',
      '--vLearningBg': '230 238 245',
      '--vLearningLine': '60 125 168',
      '--vFamiliarBg': '251 247 213',
      '--vFamiliarLine': '180 160 80',
      '--vKnownBg': '230 243 236',
      '--vKnownLine': '47 122 87',
    },
  },
  {
    id: 'paper',
    label: 'Paperlight',
    mode: 'light',
    variables: {
      '--canvas': '250 249 247',
      '--panel': '255 255 255',
      '--muted': '240 237 230',
      '--ink': '28 24 21',
      '--subink': '88 82 74',
      '--faint': '132 125 117',
      '--border': '225 219 210',
      '--border2': '203 195 184',
      '--brand': '26 102 96',
      '--brandSoft': '221 240 238',
      '--accent': '176 98 46',
      '--danger': '173 40 29',
      '--dangerSoft': '252 236 236',
      '--success': '22 102 77',
      '--successSoft': '228 244 237',
      '--vUnknownBg': '252 239 224',
      '--vUnknownLine': '202 126 48',
      '--vLearningBg': '228 238 246',
      '--vLearningLine': '52 114 165',
      '--vFamiliarBg': '251 247 215',
      '--vFamiliarLine': '180 162 82',
      '--vKnownBg': '226 244 235',
      '--vKnownLine': '42 114 80',
    },
  },
  {
    id: 'midnight',
    label: 'Midnight Fern',
    mode: 'dark',
    variables: {
      '--canvas': '12 16 16',
      '--panel': '22 28 28',
      '--muted': '32 42 42',
      '--ink': '228 235 232',
      '--subink': '145 160 155',
      '--faint': '80 95 90',
      '--border': '42 52 50',
      '--border2': '55 68 65',
      '--brand': '34 165 125',
      '--brandSoft': '20 45 40',
      '--accent': '210 130 60',
      '--danger': '220 80 80',
      '--dangerSoft': '55 25 25',
      '--success': '34 165 125',
      '--successSoft': '20 45 40',
      '--vUnknownBg': '55 38 22',
      '--vUnknownLine': '200 140 70',
      '--vLearningBg': '22 45 60',
      '--vLearningLine': '80 150 200',
      '--vFamiliarBg': '45 40 22',
      '--vFamiliarLine': '200 180 90',
      '--vKnownBg': '22 48 38',
      '--vKnownLine': '60 160 120',
    },
  },
  {
    id: 'slate',
    label: 'Slate Harbor',
    mode: 'dark',
    variables: {
      '--canvas': '15 18 24',
      '--panel': '24 29 38',
      '--muted': '35 45 58',
      '--ink': '230 235 242',
      '--subink': '142 154 172',
      '--faint': '75 88 108',
      '--border': '48 58 78',
      '--border2': '62 76 98',
      '--brand': '50 140 210',
      '--brandSoft': '20 40 60',
      '--accent': '220 160 40',
      '--danger': '230 80 80',
      '--dangerSoft': '60 25 25',
      '--success': '60 170 110',
      '--successSoft': '15 45 30',
      '--vUnknownBg': '55 38 25',
      '--vUnknownLine': '210 150 70',
      '--vLearningBg': '25 42 68',
      '--vLearningLine': '80 140 210',
      '--vFamiliarBg': '48 42 25',
      '--vFamiliarLine': '210 190 100',
      '--vKnownBg': '22 45 52',
      '--vKnownLine': '60 160 150',
    },
  },
];

export const THEME_BY_ID = Object.fromEntries(
  THEMES.map((theme) => [theme.id, theme])
) as Record<ThemeId, ThemeDefinition>;
