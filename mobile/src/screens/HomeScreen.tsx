import { useState } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EventCard from "../components/EventCard";
import Header from "../components/Header";
import NotificationsModal from "../components/NotificationsModal";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";

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

  const events = [
    { title: "Ensaio da Banda", date: "25/11/2025 18:00", role: "Cantor" },
    { title: "Reunião de Obreiros", date: "26/11/2025 19:00", role: "Músico" },
    { title: "Culto de Celebração", date: "27/11/2025 19:00", role: "Tecladista" },
    { title: "Ensaio da Banda", date: "25/11/2025 18:00", role: "Cantor" },
    { title: "Reunião de Obreiros", date: "26/11/2025 19:00", role: "Músico" },
    { title: "Culto de Celebração", date: "27/11/2025 19:00", role: "Tecladista" },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff", paddingHorizontal: 16 }}
      edges={['top', 'left', 'right']}
    >
      <Header
        title="Próximo evento"
        onNotificationPress={() => setModalVisible(true)}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 4 }}>
        {events.map((event, idx) => (
          <EventCard
            key={idx}
            title={event.title}
            date={event.date}
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
