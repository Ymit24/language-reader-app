import { View } from 'react-native';

type LanguageFlagProps = {
  code: 'fr' | 'de' | 'ja';
  size?: number;
};

export function LanguageFlag({ code, size = 32 }: LanguageFlagProps) {
  const flagSize = size;

  const flagStyle = {
    borderWidth: 1,
    borderColor: '#E5E5E5',
  };

  switch (code) {
    case 'fr':
      return (
        <View
          style={{
            width: flagSize,
            height: flagSize * 0.667,
            flexDirection: 'row',
            borderRadius: 3,
            overflow: 'hidden',
            ...flagStyle,
          }}
        >
          <View style={{ flex: 1, backgroundColor: '#0055A4' }} />
          <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
          <View style={{ flex: 1, backgroundColor: '#EF4135' }} />
        </View>
      );
    case 'de':
      return (
        <View
          style={{
            width: flagSize,
            height: flagSize * 0.667,
            borderRadius: 3,
            overflow: 'hidden',
            ...flagStyle,
          }}
        >
          <View style={{ flex: 1, backgroundColor: '#000000' }} />
          <View style={{ flex: 1, backgroundColor: '#DD0000' }} />
          <View style={{ flex: 1, backgroundColor: '#FFCC00' }} />
        </View>
      );
    case 'ja':
      return (
        <View
          style={{
            width: flagSize,
            height: flagSize * 0.667,
            backgroundColor: '#FFFFFF',
            borderRadius: 3,
            justifyContent: 'center',
            alignItems: 'center',
            ...flagStyle,
          }}
        >
          <View
            style={{
              width: flagSize * 0.5,
              height: flagSize * 0.5,
              borderRadius: (flagSize * 0.5) / 2,
              backgroundColor: '#BC002D',
            }}
          />
        </View>
      );
    default:
      return null;
  }
}
