import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Calendar, CalendarX } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EventCard from "../../components/card/EventCard";
import MiniCard from "../../components/card/MiniCard";
import HeaderPrimary from "../../components/Header/HeaderPrimary";
import NotificationsModal from "../../components/utils/NotificationsModal";
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

  function handleBlockDatesScreen() {
    navigation.navigate("BlockDatesScreen");
  }

  function handleEventDetails() {
    navigation.navigate("EventsScreen");
  }

  const events = [
    {
      title: "Ensaio da Banda",
      date: "25/11/2025 18:00",
      location: "Sala de ensaio",
      department: "louvor",
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
    <SafeAreaView className="flex-1 bg-white px-4" edges={['top', 'left', 'right']}>
      <HeaderPrimary
        title="Próximos eventos"
        onNotificationPress={() => setModalVisible(true)}
        onAvatarPress={() => navigation.navigate("Profile")}
        avatarUri=""
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 2 }}>
        <View className="flex-row gap-3 mb-4">
          <MiniCard
            title="Bloquear data"
            icon={<CalendarX />}
            onPress={handleBlockDatesScreen}
          />
          <MiniCard
            title="Ver Eventos"
            textColor="#fff"
            backgroundColor="#000000"
            icon={<Calendar color="#fff" />}
            onPress={handleEventDetails}
          />
        </View>

        {events.map((event, idx) => (
          <EventCard
            key={idx}
            title={event.title}
            date={event.date}
            location={event.location}
            department={event.department}
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
