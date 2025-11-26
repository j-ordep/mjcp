import { TouchableOpacity, Text } from "react-native";

interface ButtonProps {
  children: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
}

export default function Button({ children, onPress, variant = 'primary' }: ButtonProps) {
  const variants = {
    primary: 'bg-black',
    secondary: 'bg-purple-500',
    outline: 'bg-transparent border-2 border-gray-300',
  };

  const textVariants = {
    primary: 'text-white',
    secondary: 'text-white',
    outline: 'text-black',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`px-6 py-3 rounded-lg ${variants[variant]}`}
    >
      <Text className={`text-center font-semibold ${textVariants[variant]}`}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}