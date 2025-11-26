import { Eye, EyeOff } from "lucide-react-native";
import { useState, useRef } from "react";
import { Keyboard, TouchableWithoutFeedback, View, TouchableOpacity } from "react-native";
import { TextInput, Button, Text } from "react-native-paper";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  // Referência para o campo de senha
  const passwordRef = useRef<any>(null);

  const user = { email: "user1@gmail", password: "1234" };

  function handleLogin() {
    if (email !== user.email || password !== user.password) {
      return;
    }
    navigation.replace("Main");
  }

  function handleSignupClick() {
    navigation.replace("SignUp");
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="flex-1 justify-center p-8 bg-white">
        <Text variant="headlineMedium" style={{ textAlign: "center", marginBottom: 32 }}>
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
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
        </View>

        <View style={{ marginBottom: 32 }}>
          <TextInput
            ref={passwordRef}
            label="Senha"
            mode="outlined"
            activeOutlineColor="black"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!passwordVisible}
            right={
                <TextInput.Icon
                  icon={() =>
                    passwordVisible ? <EyeOff size={20}/> : <Eye size={20}/>
                  }
                  onPress={() => setPasswordVisible(!passwordVisible)}
                />
              }
            style={{ backgroundColor: 'transparent' }}
          />
        </View>

        <Button mode="contained" buttonColor="black" onPress={handleLogin}>
          Entrar
        </Button>

        <TouchableOpacity onPress={handleSignupClick} style={{ marginTop: 24 }}>
          <Text style={{ color: "#2563eb", textAlign: "center", textDecorationLine: "underline" }}>
            Cadastre-se
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}
