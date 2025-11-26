import { useRef, useState } from "react";
import { Keyboard, TouchableWithoutFeedback, View } from "react-native";
import { TextInput, Button, Text } from "react-native-paper";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");


  function handleLogin() {
    if (!email || !password) return;

    navigation.replace("Main");
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
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
            activeOutlineColor="black"
            value={email}
            onChangeText={setEmail}
            style={{ backgroundColor: 'transparent' }}
          />
        </View>

        <View style={{ marginBottom: 32 }}>
          <TextInput
            label="Senha"
            mode="outlined"
            activeOutlineColor="black"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={{ backgroundColor: 'transparent' }}
          />
        </View>

        <Button mode="contained" buttonColor="black" onPress={handleLogin}>
          Entrar
        </Button>
      </View>
    </TouchableWithoutFeedback>
  );
}
