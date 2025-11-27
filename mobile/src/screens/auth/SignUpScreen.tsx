import { useState, useRef } from "react";
import { Keyboard, ScrollView, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { Eye, EyeOff } from "lucide-react-native";

export default function SignUp({ navigation }) {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const surnameRef = useRef<any>(null);
  const phoneRef = useRef<any>(null);
  const emailRef = useRef<any>(null);
  const passwordRef = useRef<any>(null);
  const confirmPasswordRef = useRef<any>(null);

  function handleSignUp() {
    if (email == "" || password == "" || confirmPassword !== password) {
      return console.log("erro ao cadastrar-se");
    }

    navigation.replace("Main");
  }

  function handleLoginClick() {
    navigation.replace("Login");
  }
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="flex-1 justify-center p-8 bg-white">
        <Text variant="headlineMedium" style={{ textAlign: "center", marginTop: 115, marginBottom: 32 }}>
          Cadastre-se
        </Text>
        <ScrollView keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 4 }}>
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <TextInput
                label="Nome"
                mode="outlined"
                activeOutlineColor="black"
                value={name}
                onChangeText={setName}
                style={{ backgroundColor: 'transparent' }}
                onSubmitEditing={() => surnameRef.current?.focus()}
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextInput
                ref={surnameRef}
                label="Sobrenome"
                mode="outlined"
                activeOutlineColor="black"
                value={surname}
                onChangeText={setSurname}
                style={{ backgroundColor: 'transparent' }}
                onSubmitEditing={() => phoneRef.current?.focus()}
              />
            </View>
          </View>

          <View style={{ marginBottom: 16 }}>
            <TextInput
              ref={phoneRef}
              label="Número"
              mode="outlined"
              activeOutlineColor="black"
              value={phone}
              onChangeText={setPhone}
              style={{ backgroundColor: 'transparent' }}
              onSubmitEditing={() => emailRef.current?.focus()}
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <TextInput
              ref={emailRef}
              label="Email"
              mode="outlined"
              activeOutlineColor="black"
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
              style={{ backgroundColor: 'transparent' }}
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
              style={{ backgroundColor: 'transparent' }}
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              textContentType={'oneTimeCode'} // remove sugestão de strong password (IOS)
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
              style={{ backgroundColor: 'transparent' }}
              returnKeyType="done"
              textContentType={'oneTimeCode'} // remove sugestão de strong password (IOS)
              secureTextEntry={!confirmPasswordVisible}
              right={
                <TextInput.Icon
                  icon={() =>
                    confirmPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />
                  }
                  onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                />
              }
            />
          </View>

          <Button mode="contained" buttonColor="black" onPress={handleSignUp}>
            Cadastrar-se
          </Button>

          <TouchableOpacity onPress={handleLoginClick} style={{ marginTop: 24 }}>
            <Text style={{ color: "#2563eb", textAlign: "center", textDecorationLine: "underline" }}>
              Fazer login
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}