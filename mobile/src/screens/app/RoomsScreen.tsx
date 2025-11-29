import { Calendar as CalendarIcon } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import RoomCard from "../../components/card/RoomCard";
import HeaderSecondary from "../../components/Header/HeaderSecondary";

export default function EventsScreen({ navigation }) {
  const [selectedDate, setSelectedDate] = useState("27/11/2025");
  const [selectedTime, setSelectedTime] = useState("19:00");

  const timeSlots = [
    "08:00",
    "10:00",
    "14:00",
    "16:00",
    "18:00",
    "19:00",
    "20:00",
  ];

  const rooms = [
    { id: 1, name: "Sala de Ensaio 1", capacity: 15, status: "available" },
    { id: 2, name: "Sala de Ensaio 2", capacity: 20, status: "occupied", occupiedBy: "Banda de Louvor", occupiedDepartment: "Ministério de Música", occupiedTime: "19:00 - 21:00" },
    { id: 3, name: "Auditório Principal", capacity: 100, status: "available" },
    { id: 4, name: "Sala de Reunião", capacity: 12, status: "occupied", occupiedBy: "Reunião de Líderes", occupiedDepartment: "Liderança", occupiedTime: "19:00 - 20:30" },
    { id: 5, name: "Sala de Oração", capacity: 8, status: "available" },
    { id: 6, name: "Estúdio de Gravação", capacity: 6, status: "available" },
  ];

  const handleReserve = (roomId: number) => {
    alert(`Reservar sala ${roomId} para ${selectedDate} às ${selectedTime}`);
  };

  const handleViewDetails = (roomId: number) => {
    alert(`Ver detalhes da sala ${roomId}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={['top', 'left', 'right']}>

      <HeaderSecondary navigation={navigation} title={"Salas"} />

      {/* Rooms List */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 }}>
        {/* Date Selector */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: "#888", marginBottom: 6, fontSize: 14 }}>Data</Text>
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#f3f4f6",
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#e5e7eb",
              paddingVertical: 12,
              paddingHorizontal: 16,
            }}
          >
            <CalendarIcon size={20} color="#666" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 15 }}>{selectedDate}</Text>
          </TouchableOpacity>
        </View>

        {/* Time Slots */}
        <View style={{ marginBottom: 8 }}>
          <Text style={{ color: "#888", marginBottom: 6, fontSize: 14 }}>Horário</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {timeSlots.map((time) => (
              <TouchableOpacity
                key={time}
                onPress={() => setSelectedTime(time)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 18,
                  borderRadius: 10,
                  backgroundColor: selectedTime === time ? "#000" : "#f3f4f6",
                  borderWidth: selectedTime === time ? 0 : 1,
                  borderColor: "#e5e7eb",
                  marginRight: 4,
                }}
              >
                <Text style={{
                  color: selectedTime === time ? "#fff" : "#222",
                  fontWeight: selectedTime === time ? "bold" : "normal",
                  fontSize: 15,
                }}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12, marginBottom: 12 }}>
          <Text style={{ color: "#888", fontSize: 14 }}>
            {rooms.filter((r) => r.status === "available").length} salas disponíveis
          </Text>
        </View>

        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            {...room}
            onReserve={() => handleReserve(room.id)}
            onViewDetails={() => handleViewDetails(room.id)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}