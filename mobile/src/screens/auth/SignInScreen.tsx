import { Eye, EyeOff } from "lucide-react-native";
import { useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Text, TextInput } from "react-native-paper";
import DefaultButton from "../../components/button/DefaultButton";
import { signIn } from "../../services/authService";

export default function SignInScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordRef = useRef<any>(null);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Erro", "Preencha email e senha.");
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      Alert.alert("Erro ao entrar", error);
    }
  }

  function handleSignupClick() {
    navigation.replace("SignUp");
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
            style={{ backgroundColor: "transparent" }}
            returnKeyType="next"
            autoCapitalize="none"
            keyboardType="email-address"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
        </View>

        <View style={{ marginBottom: 32 }}>
          <TextInput
            ref={passwordRef}
            label="Senha"
            mode="outlined"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!passwordVisible}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            right={
              <TextInput.Icon
                icon={() =>
                  passwordVisible ? <EyeOff size={20} /> : <Eye size={20} />
                }
                onPress={() => setPasswordVisible(!passwordVisible)}
              />
            }
            style={{ backgroundColor: "transparent" }}
          />
        </View>

        {isLoading ? (
          <View className="items-center py-3">
            <Text style={{ color: "#888" }}>Entrando...</Text>
          </View>
        ) : (
          <DefaultButton onPress={handleLogin} variant="primary">
            Entrar
          </DefaultButton>
        )}

        <TouchableOpacity onPress={handleSignupClick} style={{ marginTop: 24 }}>
          <Text
            style={{
              color: "#2563eb",
              textAlign: "center",
              textDecorationLine: "underline",
            }}
          >
            Cadastre-se
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}
