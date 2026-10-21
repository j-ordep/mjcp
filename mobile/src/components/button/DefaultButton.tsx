import { ActivityIndicator } from "react-native";
import { Text } from "../ui/text";
import { Button } from "../ui/button";
import { colors } from "../../theme/colors";

interface ButtonProps {
  children: string;
  onPress?: () => void;
  variant?: 'primary' | 'outline' | 'destructive';
  isLoading?: boolean;
  disabled?: boolean;
}

export default function DefaultButton({
  children,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
}: ButtonProps) {

  const baseClass = "h-auto rounded-xl border py-3 justify-center items-center w-full min-h-12";
  const variants = {
    primary: "bg-primary border-primary active:bg-primary-pressed",
    outline: "bg-card border-input active:bg-secondary",
    destructive: "bg-destructive-muted border-destructive-border",
  };
  const textVariants = {
    primary: "text-primary-foreground",
    outline: "text-secondary-foreground",
    destructive: "text-destructive",
  };

  return (
    <Button
      variant={variant === 'primary' ? 'default' : variant}
      className={`${baseClass} ${variants[variant]}`} 
      onPress={isLoading || disabled ? undefined : onPress}
      disabled={isLoading || disabled}
      style={{
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.primaryForeground : variant === 'destructive' ? colors.destructive : colors.primary} />
      ) : (
        <Text className={`shrink text-center font-semibold text-base ${textVariants[variant]}`}>
          {children}
        </Text>
      )}
    </Button>
  );
}
