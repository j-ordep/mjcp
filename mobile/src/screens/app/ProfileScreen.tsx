import { View } from "react-native";
import { Avatar, Button, Surface, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen({ navigation }) {
  function handleLogoutClick() {
    navigation.replace("Login");
  }

  function handleEditProfile() {
    navigation.navigate("EditProfile");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f6fa", padding: 24 }}>
      <Surface
        style={{
          borderRadius: 20,
          paddingHorizontal: 40,
          paddingTop: 40,
          paddingBottom: 60,
          alignItems: "center",
          marginTop: 90,
          marginBottom: 32,
          elevation: 4,
          backgroundColor: "#fff",
        }}
      >
        <Avatar.Image
          size={90}
          source={{ uri: "https://avatar.iran.liara.run/public/46" }}
          style={{ marginBottom: 12 }}
        />
        <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 2 }}>NOME</Text>
        <Text style={{ color: "#888", marginBottom: 12 }}>Pastor</Text>

        <Button
          mode="outlined"
          onPress={handleEditProfile}
          style={{ borderRadius: 16, marginBottom: 8 }}
          labelStyle={{ fontWeight: "bold" }}
        >
          Editar perfil
        </Button>

        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", width: "100%", marginTop: 12 }}>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 2 }}>Email</Text>
            <Text style={{ color: "#888", fontSize: 13 }}>user1@gmail</Text>
          </View>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 2 }}>Número</Text>
            <Text style={{ color: "#888", fontSize: 13 }}>9999999</Text>
          </View>
        </View>

      </Surface>

      {/* Botão Sair */}
      <Button
        mode="contained"
        buttonColor="#000000"
        textColor="#fff"
        onPress={handleLogoutClick}
        style={{ borderRadius: 8 }}
        labelStyle={{ fontWeight: "bold" }}
      >
        Sair
      </Button>
    </SafeAreaView>
  );
}