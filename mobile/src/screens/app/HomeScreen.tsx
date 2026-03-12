import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Calendar,
  CalendarX,
  Church,
  RefreshCw,
} from "lucide-react-native";
import { useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import MiniCard from "../../components/card/MiniCard";
import ScheduleSummaryCard from "../../components/card/ScheduleSummaryCard";
import YoutubeCarousel from "../../components/card/YoutubeCarousel";
import HeaderPrimary from "../../components/Header/HeaderPrimary";
import NotificationsModal from "../../components/utils/NotificationsModal";
import { RootStackParamList } from "../../navigation/AppNavigator";

export default function HomeScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Mock: próxima escala do usuário (apenas 1)
  const nextSchedules = [
    {
      title: "Ensaio da Banda",
      date: "25/11/2025  •  18:00",
      role: "Cantor",
    },
  ];

  // Mock: próximos 2 eventos da igreja
  const nextEvents = [
    {
      title: "Culto de Domingo",
      date: "01/12/2025  •  10:00",
      location: "Templo Principal",
    },
    {
      title: "Reunião de Líderes",
      date: "03/12/2025  •  19:30",
      location: "Sala de Reuniões",
    },
  ];

  return (
    <SafeAreaView
      className="flex-1 bg-white px-4"
      edges={["top", "left", "right"]}
    >
      <HeaderPrimary
        subtitle="Bem-vindo de volta"
        title="Dashboard"
        onNotificationPress={() => setModalVisible(true)}
        onAvatarPress={() => navigation.navigate("Profile")}
        avatarUri=""
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24, paddingTop: 2 }}
      >
        {/* 4 MiniCards — grid 2x2 */}
        <View className="flex-row gap-3 mb-2">
          <MiniCard
            title="Minhas Escalas"
            textColor="#fff"
            backgroundColor="#000000"
            icon={<Calendar color="#fff" size={22} />}
            onPress={() => navigation.navigate("MySchedulesScreen")}
          />
          <MiniCard
            title="Eventos da Igreja"
            icon={<Calendar size={22} />}
            onPress={() => navigation.navigate("EventsScreen")}
          />
        </View>
        <View className="flex-row gap-3 mb-5">
          <MiniCard
            title="Bloquear Datas"
            icon={<CalendarX size={22} />}
            onPress={() => navigation.navigate("BlockDatesScreen")}
          />
          <MiniCard
            title="Solicitar Troca"
            icon={<RefreshCw size={22} />}
            onPress={() => alert("Funcionalidade em breve!")}
          />
        </View>

        {/* Próxima Escala */}
        <View className="flex-row items-center justify-between mb-2 mt-1">
          <Text style={{ fontWeight: "bold", fontSize: 16, color: "#111827" }}>
            Próxima Escala
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("MySchedulesScreen")}
          >
            <Text style={{ fontSize: 13, color: "#888" }}>Ver todas →</Text>
          </TouchableOpacity>
        </View>
        {nextSchedules.map((s, idx) => (
          <ScheduleSummaryCard
            key={`schedule-${idx}`}
            title={s.title}
            date={s.date}
            role={s.role}
            onPress={() =>
              navigation.navigate("EventDetails", {
                title: s.title,
                date: s.date,
                role: s.role,
              })
            }
          />
        ))}

        {/* Próximos Eventos */}
        <View className="flex-row items-center justify-between mb-2 mt-3">
          <Text style={{ fontWeight: "bold", fontSize: 16, color: "#111827" }}>
            Próximos Eventos
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("EventsScreen")}
          >
            <Text style={{ fontSize: 13, color: "#888" }}>Ver todos →</Text>
          </TouchableOpacity>
        </View>
        {nextEvents.map((e, idx) => (
          <ScheduleSummaryCard
            key={`event-${idx}`}
            title={e.title}
            date={e.date}
            location={e.location}
            onPress={() =>
              navigation.navigate("EventDetails", {
                title: e.title,
                date: e.date,
              })
            }
          />
        ))}

        {/* YouTube Carousel */}
        <View className="mt-3">
          <YoutubeCarousel />
        </View>
      </ScrollView>

      <NotificationsModal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}
