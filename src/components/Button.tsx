import {
  ActivityIndicator,
  TouchableOpacity,
  Text,
  TouchableOpacityProps,
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  children: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
}

const variantStyles = {
  primary: 'bg-brand active:bg-brand/90',
  secondary: 'border border-border/80 bg-panel active:bg-muted',
  ghost: 'active:bg-muted/80',
  destructive: 'bg-dangerSoft border border-danger/30 active:bg-dangerSoft/70',
};

const textStyles = {
  primary: 'text-white',
  secondary: 'text-ink',
  ghost: 'text-subink',
  destructive: 'text-danger',
};

export function Button({
  variant = 'primary',
  children,
  className = '',
  isLoading = false,
  loadingText,
  disabled,
  ...props
}: ButtonProps) {
  const spinnerColor = variant === 'primary' ? '#FFFFFF' : '#6B7280';
  const showText =
    typeof children === 'string' || typeof loadingText === 'string';
  const textContent = isLoading ? (loadingText ?? children) : children;

  return (
    <TouchableOpacity
      className={`flex-row items-center justify-center gap-2 rounded-lg px-4 py-2.5 ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <ActivityIndicator size="small" color={spinnerColor} />}
      {showText ? (
        <Text className={`font-sans-semibold text-sm ${textStyles[variant]}`}>
          {textContent}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}

interface IconButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  accessibilityLabel: string;
}

export function IconButton({
  children,
  accessibilityLabel,
  className = '',
  ...props
}: IconButtonProps) {
  return (
    <TouchableOpacity
      className={`h-9 w-9 items-center justify-center rounded-lg border border-border/80 bg-panel active:bg-muted ${className}`}
      accessibilityLabel={accessibilityLabel}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
}
