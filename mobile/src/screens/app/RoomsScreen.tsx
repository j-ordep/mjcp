import { Calendar as CalendarIcon } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context";
import RoomCard from "../../components/card/RoomCard";
import HeaderSecondary from "../../components/Header/HeaderSecondary";

export default function EventsScreen({ navigation }) {
  const [selectedDate, setSelectedDate] = useState("27/11/2025");
  const [selectedTime, setSelectedTime] = useState("19:00");

  const timeSlots = [
    "07:00",
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
    "22:00",
    "23:00",
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
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <HeaderSecondary title={"Salas"} onBack={() => navigation.goBack()} />

      {/* Rooms List */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 }} showsHorizontalScrollIndicator={false}>
        {/* Date Selector */}
        <View className="mb-4">
           <Text style={{ color: "#888", marginBottom: 6, fontSize: 14 }}>Data</Text>
          <TouchableOpacity className="flex-row items-center bg-gray-100 rounded-xl border border-gray-200 py-3 px-4">
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

        <View className="flex-row items-center justify-between mt-3 mb-2">
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