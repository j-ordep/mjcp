import { Text, TouchableOpacity, ActivityIndicator, View } from "react-native";

interface ButtonProps {
  children: string;
  onPress?: () => void;
  variant?: 'primary' | 'outline';
  isLoading?: boolean;
}

export default function DefaultButton({ children, onPress, variant = 'primary', isLoading = false }: ButtonProps) {

  const baseClass = "rounded-2xl border-2 py-3.5 justify-center items-center w-full min-h-[58px]";
  const variants = {
    primary: "bg-black border-black",
    outline: "bg-white border-gray-300",
  };
  const textVariants = {
    primary: "text-white",
    outline: "text-black",
  };

  return (
    <TouchableOpacity 
      className={`${baseClass} ${variants[variant]}`} 
      onPress={isLoading ? undefined : onPress}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' ? "#fff" : "#000"} />
      ) : (
        <Text className={`text-center font-semibold text-base ${textVariants[variant]}`}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}