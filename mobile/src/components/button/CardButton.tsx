import { Text, TouchableOpacity } from "react-native";
import { lightTheme } from "../../theme/theme";

interface ButtonProps {
  children: string;
  onPress?: () => void;
  variant?: 'primary' | 'outline';
}

const buttonStyles = {
  primary: {
    backgroundColor: "#000",
    borderColor: "#000",
    color: "#fff",
  },
  outline: {
    backgroundColor: "#fff",
    borderColor: "#d1d5db",
    color: "#000",
  },
};

export default function CardButton({ children, onPress, variant = 'primary' }: ButtonProps) {
  const style = buttonStyles[variant];
  const b = lightTheme[variant]

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: style.backgroundColor,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: style.borderColor,
        paddingVertical: 16,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{
        textAlign: "center",
        fontWeight: "600",
        fontSize: 16,
        color: style.color,
      }}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}