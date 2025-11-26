import { DarkTheme } from "@react-navigation/native";
import { useState } from "react";
import { KeyboardAvoidingView, View } from "react-native";
import { TextInput, Button, Text } from "react-native-paper";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin() {
    if (!email || !password) return;

    navigation.replace("Home");
  }

  return (
    <View className="flex-1 justify-center p-8 bg-white">
      <Text
        variant="headlineMedium"
        style={{ textAlign: "center", marginBottom: 32 }}
      >
        Login
      </Text>

      <View style={{ marginBottom: 16 }}>
        <TextInput
          label="Email"
          mode="outlined"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View style={{ marginBottom: 32 }}>
        <TextInput
          label="Senha"
          mode="outlined"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <Button mode="contained" buttonColor="black" onPress={handleLogin}>
        Entrar
      </Button>
    </View>
  );
}
