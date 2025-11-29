import { Clock, Users } from "lucide-react-native";
import { View } from "react-native";
import { Text } from "react-native-paper";
import CardButton from "../button/CardButton";

export default function RoomCard({
  name,
  capacity,
  status,
  occupiedBy = "",
  occupiedDepartment = "",
  occupiedTime = "",
  onReserve,
  onViewDetails,
}) {
  return (
    <View style={{
      backgroundColor: "#fff",
      borderRadius: 18,
      borderWidth: 1,
      borderColor: "#ececec",
      padding: 18,
      minHeight: 180,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOpacity: 0.03,
      shadowRadius: 2,
      elevation: 1,
    }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <Text style={{ fontWeight: "bold", fontSize: 16 }}>{name}</Text>
        <View style={{
          backgroundColor: status === "available" ? "#eafcf3" : "#f6f6f6",
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 4,
        }}>
          <Text style={{
            color: status === "available" ? "#22c55e" : "#888",
            fontWeight: "bold",
            fontSize: 13,
          }}>
            {status === "available" ? "Disponível" : "Ocupada"}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
        <Users size={16} color="#888" style={{ marginRight: 6 }} />
        <Text style={{ color: "#888", fontSize: 13 }}>Até {capacity} pessoas</Text>
      </View>
      {status === "occupied" && (
        <View style={{
          backgroundColor: "#f6f6f6",
          borderRadius: 12,
          padding: 12,
          marginBottom: 10,
        }}>
          <Text style={{ fontWeight: "bold", fontSize: 15 }}>{occupiedBy}</Text>
          <Text style={{ color: "#888", fontSize: 13 }}>{occupiedDepartment}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
            <Clock size={15} color="#888" style={{ marginRight: 4 }} />
            <Text style={{ color: "#888", fontSize: 13 }}>{occupiedTime}</Text>
          </View>
        </View>
      )}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <CardButton variant="outline" onPress={onViewDetails}>
            Ver detalhes
          </CardButton>
        </View>
        {status === "available" && (
          <View style={{ flex: 1 }}>
            <CardButton variant="primary" onPress={onReserve}>
              Reservar
            </CardButton>
          </View>
        )}
      </View>
    </View>
  );
}