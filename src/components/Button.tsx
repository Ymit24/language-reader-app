import { TouchableOpacity, Text, TouchableOpacityProps } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

const variantStyles = {
  primary: 'bg-ink active:bg-ink/90',
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

export function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  return (
    <TouchableOpacity
      className={`rounded-lg px-4 py-2.5 flex-row items-center justify-center gap-2 ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {typeof children === 'string' ? (
        <Text className={`text-sm font-sans-semibold ${textStyles[variant]}`}>{children}</Text>
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

export function IconButton({ children, accessibilityLabel, className = '', ...props }: IconButtonProps) {
  return (
    <TouchableOpacity
      className={`rounded-lg h-9 w-9 items-center justify-center border border-border/80 bg-panel active:bg-muted ${className}`}
      accessibilityLabel={accessibilityLabel}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
}
