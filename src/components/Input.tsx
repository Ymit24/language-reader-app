import { TextInput, TextInputProps, Text, View } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <View className="gap-1.5">
      {label && (
        <Text className="text-sm font-medium text-ink">{label}</Text>
      )}
      <TextInput
        className={`rounded-md border bg-panel px-3 py-2.5 text-sm text-ink placeholder:text-faint focus:border-brand focus:outline-none ${error ? 'border-danger' : 'border-border'}`}
        {...props}
      />
      {error && (
        <Text className="text-xs text-danger">{error}</Text>
      )}
    </View>
  );
}
