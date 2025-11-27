import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, Button, TextInput, Text } from "react-native-paper";
import { useState } from "react";

export default function EditProfileScreen({ navigation }) {
  const [name, setName] = useState("NOME");
  const [role, setRole] = useState("Pastor");
  const [email, setEmail] = useState("user1@gmail");
  const [phone, setPhone] = useState("9999999");
  const [avatar, setAvatar] = useState("https://avatar.iran.liara.run/public/46");
  const [password, setPassword] = useState("");

  function handleSave() {
    navigation.goBack();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f6fa", padding: 24 }}>
      <View style={{ alignItems: "center", marginBottom: 24 }}>
        <Avatar.Image size={72} source={{ uri: avatar }} />
        <Button
          mode="text"
          onPress={() => {/* lógica para trocar foto */}}
          labelStyle={{ color: "#2563eb" }}
        >
          Trocar foto
        </Button>
      </View>

      <TextInput
        label="Nome"
        mode="outlined"
        value={name}
        onChangeText={setName}
        style={{ marginBottom: 16 }}
      />
      <TextInput
        label="Função"
        mode="outlined"
        value={role}
        onChangeText={setRole}
        style={{ marginBottom: 16 }}
      />
      <TextInput
        label="Email"
        mode="outlined"
        value={email}
        onChangeText={setEmail}
        style={{ marginBottom: 16 }}
      />
      <TextInput
        label="Número"
        mode="outlined"
        value={phone}
        onChangeText={setPhone}
        style={{ marginBottom: 16 }}
      />
      <TextInput
        label="Nova senha"
        mode="outlined"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ marginBottom: 24 }}
      />

      <Button
        mode="contained"
        buttonColor="#2563eb"
        textColor="#fff"
        onPress={handleSave}
        style={{ borderRadius: 8 }}
        labelStyle={{ fontWeight: "bold" }}
      >
        Salvar alterações
      </Button>
    </SafeAreaView>
  );
}