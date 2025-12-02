import React, { forwardRef } from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";

interface InputProps extends TextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  containerStyle?: object;
}

const Input = forwardRef<TextInput, InputProps>(
  ({ label, value, onChangeText, placeholder, style, containerStyle, ...rest }, ref) => {
    return (
      <View style={{ marginBottom: 22, ...(containerStyle as object) }}>
        <Text style={{ marginBottom: 8, color: "#6b7280", fontSize: 15 }}>{label}</Text>
        <TextInput
          ref={ref}
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
            ...(style as object),
          }}
          {...rest}
        />
      </View>
    );
  }
);

export default Input;