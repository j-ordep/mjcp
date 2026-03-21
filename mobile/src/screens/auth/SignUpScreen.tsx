import { Eye, EyeOff } from "lucide-react-native";
import { useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Text, TextInput } from "react-native-paper";
import DefaultButton from "../../components/button/DefaultButton";
import { signUp } from "../../services/authService";

export default function SignUp({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const emailRef = useRef<any>(null);
  const passwordRef = useRef<any>(null);
  const confirmPasswordRef = useRef<any>(null);

  async function handleSignUp() {
    if (!email || !password || !name) {
      Alert.alert("Erro", "Preencha todos os campos obrigatórios.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Erro", "As senhas não coincidem.");
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(email, password, name.trim());

    setIsLoading(false);

    if (error) {
      Alert.alert("Erro ao cadastrar", error);
    }
  }

  function handleLoginClick() {
    navigation.replace("SignIn");
  }
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="flex-1 justify-center p-8 bg-white">
        <Text
          variant="headlineMedium"
          style={{ textAlign: "center", marginTop: 80, marginBottom: 32 }}
        >
          Cadastre-se
        </Text>
        <ScrollView
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 4 }}
        >
          <View style={{ marginBottom: 16 }}>
            <TextInput
              label="Nome Completo"
              mode="outlined"
              activeOutlineColor="black"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={true}
              spellCheck={true}
              returnKeyType="next"
              style={{ backgroundColor: "transparent" }}
              onSubmitEditing={() => emailRef.current?.focus()}
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <TextInput
              ref={emailRef}
              label="Email"
              mode="outlined"
              activeOutlineColor="black"
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              value={email}
              onChangeText={setEmail}
              style={{ backgroundColor: "transparent" }}
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <TextInput
              ref={passwordRef}
              label="Senha"
              mode="outlined"
              activeOutlineColor="black"
              value={password}
              onChangeText={setPassword}
              style={{ backgroundColor: "transparent" }}
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              textContentType="oneTimeCode" // remove sugestão de strong password (IOS)
              returnKeyType="next"
              secureTextEntry={!passwordVisible}
              right={
                <TextInput.Icon
                  icon={() =>
                    passwordVisible ? <EyeOff size={20} /> : <Eye size={20} />
                  }
                  onPress={() => setPasswordVisible(!passwordVisible)}
                />
              }
            />
          </View>

          <View style={{ marginBottom: 32 }}>
            <TextInput
              ref={confirmPasswordRef}
              label="Confirmar senha"
              mode="outlined"
              activeOutlineColor="black"
              keyboardType="default"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={{ backgroundColor: "transparent" }}
              returnKeyType="done"
              textContentType="oneTimeCode" // remove sugestão de strong password (IOS)
              onSubmitEditing={handleSignUp}
              secureTextEntry={!confirmPasswordVisible}
              right={
                <TextInput.Icon
                  icon={() =>
                    confirmPasswordVisible ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )
                  }
                  onPress={() =>
                    setConfirmPasswordVisible(!confirmPasswordVisible)
                  }
                />
              }
            />
          </View>

          {isLoading ? (
            <View className="items-center py-3">
              <Text style={{ color: "#888" }}>Cadastrando...</Text>
            </View>
          ) : (
            <DefaultButton onPress={handleSignUp} variant="primary">
              Cadastrar-se
            </DefaultButton>
          )}

          <TouchableOpacity
            onPress={handleLoginClick}
            style={{ marginTop: 24 }}
          >
            <Text
              style={{
                color: "#2563eb",
                textAlign: "center",
                textDecorationLine: "underline",
              }}
            >
              Fazer login
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}
