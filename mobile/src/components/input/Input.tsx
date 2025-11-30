import { Text, TextInput, View } from "react-native";

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: object;
}

export default function Input({ label, value, onChangeText, placeholder, style }: InputProps) {
  return (
    <View style={{ marginBottom: 22 }}>
      <Text style={{ marginBottom: 8, color: "#6b7280", fontSize: 15 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        style={{
          backgroundColor: "#f6f8fa",
          borderRadius: 14,
          fontSize: 17,
          minHeight: 52,
          paddingHorizontal: 16,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          ...style,
        }}
      />
    </View>
  );
}