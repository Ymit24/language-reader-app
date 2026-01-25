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
      '--vKnownBg': '226 244 235',
      '--vKnownLine': '42 114 80',
    },
  },
  {
    id: 'midnight',
    label: 'Midnight Fern',
    mode: 'dark',
    variables: {
      '--canvas': '18 23 24',
      '--panel': '26 30 32',
      '--muted': '34 39 41',
      '--ink': '236 234 229',
      '--subink': '180 174 166',
      '--faint': '138 130 123',
      '--border': '49 56 58',
      '--border2': '62 69 71',
      '--brand': '78 176 164',
      '--brandSoft': '30 52 50',
      '--accent': '212 140 84',
      '--danger': '214 83 73',
      '--dangerSoft': '58 34 34',
      '--success': '111 207 169',
      '--successSoft': '33 54 47',
      '--vUnknownBg': '61 46 31',
      '--vUnknownLine': '224 164 93',
      '--vLearningBg': '33 47 61',
      '--vLearningLine': '116 170 216',
      '--vKnownBg': '32 54 47',
      '--vKnownLine': '122 200 166',
    },
  },
  {
    id: 'slate',
    label: 'Slate Harbor',
    mode: 'dark',
    variables: {
      '--canvas': '16 20 27',
      '--panel': '24 30 40',
      '--muted': '32 40 52',
      '--ink': '232 235 241',
      '--subink': '174 181 193',
      '--faint': '130 139 153',
      '--border': '47 56 72',
      '--border2': '63 74 92',
      '--brand': '94 190 176',
      '--brandSoft': '29 47 51',
      '--accent': '210 148 92',
      '--danger': '222 91 85',
      '--dangerSoft': '60 36 36',
      '--success': '112 198 168',
      '--successSoft': '30 49 45',
      '--vUnknownBg': '59 45 33',
      '--vUnknownLine': '218 162 96',
      '--vLearningBg': '31 45 62',
      '--vLearningLine': '117 171 219',
      '--vKnownBg': '30 51 45',
      '--vKnownLine': '118 194 162',
    },
  },
];

export const THEME_BY_ID = Object.fromEntries(
  THEMES.map((theme) => [theme.id, theme])
) as Record<ThemeId, ThemeDefinition>;
