import { Clock, Users } from "lucide-react-native";
import { View } from "react-native";
import { Text } from "react-native-paper";
import DefaultButton from "../button/DefaultButton";

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
    <View className="bg-white rounded-2xl border border-[#ececec] p-4 min-h-[80px] mb-4 shadow-sm">
      <View className="flex-row items-center justify-between mb-1.5">
        <Text style={{ fontWeight: "bold", fontSize: 16 }}>{name}</Text>
        <View className={`rounded-xl px-3 py-1 ${status === "available" ? "bg-green-50" : "bg-gray-100"}`}>
          <Text style={{
            color: status === "available" ? "#22c55e" : "#888",
            fontWeight: "bold",
            fontSize: 13,
          }}>
            {status === "available" ? "Disponível" : "Ocupada"}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center mb-2.5">
        <Users size={16} color="#888" style={{ marginRight: 6 }} />
        <Text style={{ color: "#888", fontSize: 13 }}>Até {capacity} pessoas</Text>
      </View>
      {status === "occupied" && (
        <View className="bg-gray-100 rounded-xl p-3 mb-2.5">
          <Text style={{ fontWeight: "bold", fontSize: 15 }}>{occupiedBy}</Text>
          <Text style={{ color: "#888", fontSize: 13 }}>{occupiedDepartment}</Text>
          <View className="flex-row items-center mt-1">
            <Clock size={15} color="#888" style={{ marginRight: 4 }} />
            <Text style={{ color: "#888", fontSize: 13 }}>{occupiedTime}</Text>
          </View>
        </View>
      )}
      <View className="flex-row gap-3">
        <View className="flex-1">
          <DefaultButton variant="outline" onPress={onViewDetails}>
            Ver detalhes
          </DefaultButton>
        </View>
        {status === "available" && (
          <View className="flex-1">
            <DefaultButton variant="primary" onPress={onReserve}>
              Reservar
            </DefaultButton>
          </View>
        )}
      </View>
    </View>
  );
}