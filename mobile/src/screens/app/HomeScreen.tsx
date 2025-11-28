import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ban, Calendar } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EventCard from "../../components/card/EventCard";
import MiniCard from "../../components/card/MiniCard";
import Header from "../../components/Header";
import NotificationsModal from "../../components/NotificationsModal";
import { RootStackParamList } from "../../navigation/AppNavigator";

export default function HomeScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  function handleDetails(event) {
    navigation.navigate("EventDetails", event);
  }

  function handleSwap() {
    alert("Solicitação de troca enviada!");
  }

  function handleConfirm() {
    alert("Presença confirmada!");
  }

  function handleCalendar() {
    navigation.navigate("EventsScreen"); // Renomeie EventsScreen para CalendarScreen!
  }

  const events = [
    {
      title: "Ensaio da Banda",
      date: "25/11/2025 18:00",
      location: "Sala de ensaio",
      departament: "louvor",
      role: "Cantor"
    },
    {
      title: "Reunião de Obreiros",
      date: "26/11/2025 19:00",
      location: "Auditório",
      role: "Músico"
    },
    {
      title: "Culto de Celebração",
      date: "27/11/2025 19:00",
      location: "Templo principal",
      role: "Tecladista"
    },
    { title: "Ensaio da Banda", date: "25/11/2025 18:00", role: "Cantor" },
    { title: "Reunião de Obreiros", date: "26/11/2025 19:00", role: "Músico" },
    { title: "Culto de Celebração", date: "27/11/2025 19:00", role: "Tecladista" },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f6fa", paddingHorizontal: 16 }}
      edges={['top', 'left', 'right']}
    >
      <Header
        title="Próximos eventos"
        onNotificationPress={() => setModalVisible(true)}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 2 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
          <MiniCard
            title="Bloquear data"
            icon={<Calendar />}
            onPress={handleCalendar}
          />
          <MiniCard
            title="Indisponível"
            icon={<Ban size={32} color="#ffae00" />}
            onPress={handleCalendar}
            backgroundColor="#f3f4f6"
          />
        </View>

        {events.map((event, idx) => (
          <EventCard
            key={idx}
            title={event.title}
            date={event.date}
            location={event.location}
            department={event.departament}
            role={event.role}
            onDetails={() => handleDetails(event)}
            onSwap={handleSwap}
            onConfirm={handleConfirm}
          />
        ))}
      </ScrollView>
      <NotificationsModal visible={modalVisible} onDismiss={() => setModalVisible(false)} />
    </SafeAreaView>
  );
}
