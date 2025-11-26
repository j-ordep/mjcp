import { View, Text, TouchableOpacity } from "react-native";

export default function ProfileScreen({ navigation }) {
  function handleLogoutClick() {
    navigation.replace("Login");
  }

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold">Meu Perfil</Text>

      <TouchableOpacity onPress={handleLogoutClick} style={{ marginTop: 24 }}>
          <Text style={{ color: "#2563eb", textAlign: "center", textDecorationLine: "underline" }}>
            Sair
          </Text>
      </TouchableOpacity>
    </View>
  );
}