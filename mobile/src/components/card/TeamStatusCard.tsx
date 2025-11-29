import { View } from "react-native";
import { Text } from "react-native-paper";
import { CheckCircle2, Circle } from "lucide-react-native";


interface TeamStatusCardProps {
  confirmed: number;
  pending: number;
}

export default function TeamStatusCard(props: TeamStatusCardProps) {
  return (
    <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
      <View style={{ flex: 1, backgroundColor: "#eafcf3", borderRadius: 14, borderWidth: 1, borderColor: "#d1fae5", padding: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
          <CheckCircle2 size={18} color="#22c55e" style={{ marginRight: 6 }} />
          <Text style={{ color: "#15803d", fontWeight: "bold", fontSize: 16 }}>{props.confirmed}</Text>
        </View>
        <Text style={{ color: "#22c55e", fontSize: 13 }}>Confirmados</Text>
      </View>
      <View style={{ flex: 1, backgroundColor: "#f6f6f6", borderRadius: 14, borderWidth: 1, borderColor: "#e5e7eb", padding: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
          <Circle size={18} color="#888" style={{ marginRight: 6 }} />
          <Text style={{ color: "#444", fontWeight: "bold", fontSize: 16 }}>{props.pending}</Text>
        </View>
        <Text style={{ color: "#888", fontSize: 13 }}>Pendentes</Text>
      </View>
    </View>
  );
}