import { Text, TouchableOpacity } from "react-native";

interface ButtonProps {
  children: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  rounded?: boolean;
  extraRounded?: boolean;
}

export default function CardButton({ children, onPress, variant = 'primary', rounded = false, extraRounded = false }: ButtonProps) {
  const variants = {
    primary: 'bg-black border-2 border-black',
    secondary: 'bg-[#ffae00] border-2 border-[#ffae00]',
    outline: 'bg-transparent border-2 border-gray-300',
  };

  const textVariants = {
    primary: 'text-white',
    secondary: 'text-white',
    outline: 'text-black',
  };

  const radius = extraRounded ? 'rounded-2xl' : rounded ? 'rounded-xl' : 'rounded-lg';

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`px-7 py-4 ${radius} ${variants[variant]}`}
    >
      <Text className={`text-center font-semibold ${textVariants[variant]}`}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}