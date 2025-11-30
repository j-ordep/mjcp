import { Camera } from "lucide-react-native";
import { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { Avatar, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderSecondary from "../../components/Header/HeaderSecondary";
import DefaultButton from "../../components/button/DefaultButton";
import Input from "../../components/input/Input";

export default function EditProfileScreen({ navigation }) {
  const [name, setName] = useState("Maria Silva Santos");
  const [email, setEmail] = useState("maria.santos@email.com");
  const [phone, setPhone] = useState("(11) 98765-4321");
  const [avatar, setAvatar] = useState("https://avatar.iran.liara.run/public/46");

  function handleSave() {
    navigation.goBack();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={['top', 'left', 'right']}>
      <HeaderSecondary title="Editar Perfil" onBack={() => navigation.goBack()} />

      <View style={{ alignItems: "center", marginTop: 32, marginBottom: 24 }}>
        <View style={{ position: "relative" }}>
          <Avatar.Image size={110} source={{ uri: avatar }} />
          <TouchableOpacity
            style={{
              position: "absolute",
              bottom: 4,
              right: 4,
              backgroundColor: "#000",
              borderRadius: 20,
              padding: 6,
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={() => {/* lógica para trocar foto */ }}
          >
            <Camera size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={{ textAlign: "center", fontSize: 16, color: "#6b7280", marginTop: 10 }}>
          Alterar foto
        </Text>
      </View>

      <View style={{ paddingHorizontal: 24 }}>
        <Input
          label="Nome"
          value={name}
          onChangeText={setName}
        />
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          label="Telefone"
          value={phone}
          onChangeText={setPhone}
        />
      </View>

      <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
        <DefaultButton variant="primary" onPress={handleSave}>
          Salvar
        </DefaultButton>
      </View>
    </SafeAreaView>
  );
}
