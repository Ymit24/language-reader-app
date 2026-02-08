import { TextInput, TextInputProps, Text, View } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <View className="gap-2">
      {label && (
        <Text className="font-sans-semibold text-xs uppercase tracking-widest text-faint">
          {label}
        </Text>
      )}
      <TextInput
        className={`rounded-lg border bg-panel px-3.5 py-2.5 font-sans-medium text-base text-ink placeholder:text-faint/80 focus:border-brand focus:outline-none ${error ? 'border-danger' : 'border-border/80'}`}
        {...props}
      />
      {error && (
        <Text className="font-sans-medium text-xs text-danger">{error}</Text>
      )}
    </View>
  );
}
