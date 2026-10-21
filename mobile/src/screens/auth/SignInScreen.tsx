import { colors } from "../../theme/colors";
import { Text } from "../../components/ui/text";
import { Input } from "../../components/ui/input";
import { Eye, EyeOff } from "lucide-react-native";
import { useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

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
      <View className="flex-1 justify-center p-8 bg-background">
        <Text
          variant="h3"
          style={{ textAlign: "center", marginBottom: 32 }}
        >
          Login
        </Text>

        <View style={{ marginBottom: 16 }}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            containerStyle={{ backgroundColor: "transparent" }}
            returnKeyType="next"
            autoCapitalize="none"
            keyboardType="email-address"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
        </View>

        <View style={{ marginBottom: 32 }}>
          <Input
            ref={passwordRef}
            label="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!passwordVisible}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            right={
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={passwordVisible ? "Ocultar senha" : "Mostrar senha"}
                onPress={() => setPasswordVisible(!passwordVisible)}
              >
                {passwordVisible ? <EyeOff size={20} color={colors.mutedForeground} /> : <Eye size={20} color={colors.mutedForeground} />}
              </TouchableOpacity>
            }
            containerStyle={{ backgroundColor: "transparent" }}
          />
        </View>

        {isLoading ? (
          <View className="items-center py-3">
            <Text style={{ color: colors.mutedForeground }}>Entrando...</Text>
          </View>
        ) : (
          <DefaultButton onPress={handleLogin} variant="primary">
            Entrar
          </DefaultButton>
        )}

        <TouchableOpacity onPress={handleSignupClick} style={{ marginTop: 24 }}>
          <Text
            style={{
              color: colors.primary,
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
