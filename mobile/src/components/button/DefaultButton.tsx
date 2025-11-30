import { Text, TouchableOpacity } from "react-native";

interface ButtonProps {
  children: string;
  onPress?: () => void;
  variant?: 'primary' | 'outline';
}

export default function DefaultButton({ children, onPress, variant = 'primary' }: ButtonProps) {

  const baseClass = "rounded-2xl border-2 py-3.5 justify-center items-center w-full";
  const variants = {
    primary: "bg-black border-black",
    outline: "bg-white border-gray-300",
  };
  const textVariants = {
    primary: "text-white",
    outline: "text-black",
  };

  return (
    <TouchableOpacity className={`${baseClass} ${variants[variant]}`} onPress={onPress}>
      <Text className={`text-center font-semibold text-base ${textVariants[variant]}`}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}