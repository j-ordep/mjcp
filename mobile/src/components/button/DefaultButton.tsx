import { Text, TouchableOpacity, ActivityIndicator, View } from "react-native";

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

  const baseClass = "rounded-2xl border-2 py-3.5 justify-center items-center w-full min-h-[58px]";
  const variants = {
    primary: "bg-black border-black",
    outline: "bg-white border-gray-300",
    destructive: "bg-rose-50 border-rose-200",
  };
  const textVariants = {
    primary: "text-white",
    outline: "text-black",
    destructive: "text-rose-700",
  };

  return (
    <TouchableOpacity 
      className={`${baseClass} ${variants[variant]}`} 
      onPress={isLoading || disabled ? undefined : onPress}
      disabled={isLoading || disabled}
      activeOpacity={0.7}
      style={{
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' ? "#fff" : "#be123c"} />
      ) : (
        <Text className={`text-center font-semibold text-base ${textVariants[variant]}`}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}
