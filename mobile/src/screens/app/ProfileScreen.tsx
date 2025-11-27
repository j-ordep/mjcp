import { View } from "react-native";
import { Avatar, Button, Divider, Surface, Text } from "react-native-paper";
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
          padding: 24,
          alignItems: "center",
          marginTop: 32,
          marginBottom: 24,
          elevation: 4,
          backgroundColor: "#fff",
        }}
      >
        <Avatar.Image
          size={72}
          source={{ uri: "https://avatar.iran.liara.run/public/46" }}
          style={{ marginBottom: 12 }}
        />
        <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 2 }}>NOME</Text>
        <Text style={{ color: "#888", marginBottom: 12 }}>Pastor</Text>
        <Button
          mode="outlined"
          onPress={handleEditProfile}
          style={{ borderRadius: 16, marginBottom: 16 }}
          labelStyle={{ fontWeight: "bold", color: "#2563eb" }}
        >
          Editar perfil
        </Button>
        <Divider style={{ width: "100%", marginBottom: 16 }} />
        <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%" }}>
          <View style={{ alignItems: "center", flex: 1 }}>
            <Text style={{ fontWeight: "bold", fontSize: 18 }}>Email</Text>
            <Text style={{ color: "#888", fontSize: 13 }}>user1@gmail</Text>
          </View>
          <View style={{ alignItems: "center", flex: 1 }}>
            <Text style={{ fontWeight: "bold", fontSize: 18 }}>Número</Text>
            <Text style={{ color: "#888", fontSize: 13 }}>9999999</Text>
          </View>
        </View>
      </Surface>

      <Button
        mode="contained"
        buttonColor="#000000"
        textColor="#fff"
        onPress={handleLogoutClick}
        style={{ borderRadius: 8, marginTop: 8 }}
        labelStyle={{ fontWeight: "bold" }}
      >
        Sair
      </Button>
    </SafeAreaView>
  );
}