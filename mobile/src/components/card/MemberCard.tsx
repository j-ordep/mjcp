import { View, Image } from "react-native";
import { Text } from "react-native-paper";
import { CheckCircle2 } from "lucide-react-native";

export default function MemberCard({ name, role, photo, confirmed }) {
  return (
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#fff",
      borderRadius: 12,
      padding: 10,
      borderWidth: 1,
      borderColor: "#f3f4f6",
      gap: 12,
    }}>
      <Image
        source={{ uri: photo }}
        style={{ width: 40, height: 40, borderRadius: 20 }}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: "bold", fontSize: 15 }}>{name}</Text>
        <Text style={{ color: "#888", fontSize: 13 }}>{role}</Text>
      </View>
      <Text style={{
        color: confirmed ? "#22c55e" : "#888",
        fontWeight: "bold",
        fontSize: 13,
      }}>
        {confirmed ? "Confirmado" : "Pendente"}
      </Text>
      {confirmed && <CheckCircle2 size={18} color="#22c55e" />}
    </View>
  );
}