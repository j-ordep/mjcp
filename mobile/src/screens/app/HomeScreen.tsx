import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Calendar, CalendarX, RefreshCw } from "lucide-react-native";
import { useState, useEffect } from "react";
import { formatDateTime } from "../../utils/formatDate";
import { ScrollView, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import MiniCard from "../../components/card/MiniCard";
import ScheduleSummaryCard from "../../components/card/ScheduleSummaryCard";
import YoutubeCarousel from "../../components/card/YoutubeCarousel";
import HeaderPrimary from "../../components/Header/HeaderPrimary";
import NotificationsModal from "../../components/utils/NotificationsModal";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { useEventStore } from "../../stores/useEventStore";

export default function HomeScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const { events, isLoadingEvents, fetchUpcomingEvents } = useEventStore();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Carrega os dados ao montar a tela
  useEffect(() => {
    fetchUpcomingEvents();
  }, [fetchUpcomingEvents]);



  // Pegamos apenas os 2 próximos eventos em memória
  const nextEvents = events.slice(0, 1);
  // Pega apenas a escala mais próxima

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
        {/* <View className="flex-row items-center justify-between mb-2 mt-1">
          <Text style={{ fontWeight: "bold", fontSize: 16, color: "#111827" }}>
            Próxima Escala
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("MySchedulesScreen")}
          >
            <Text style={{ fontSize: 13, color: "#888" }}>Ver todas →</Text>
          </TouchableOpacity>
        </View>
        
        {isLoadingSchedules ? (
          <View className="py-2 items-center">
            <ActivityIndicator size="small" color="#000" />
          </View>
        ) : !nextSchedule ? (
           <View className="py-2 items-center">
             <Text style={{ color: "#666" }}>Você não está escalado para os próximos dias.</Text>
           </View>
        ) : (
          <ScheduleSummaryCard
            title={nextSchedule.event.title}
            date={formatDateTime(nextSchedule.event.start_at)}
            role={nextSchedule.role_name}
            onPress={() =>
              navigation.navigate("EventDetails", {
                event: nextSchedule.event as any
              })
            }
          />
        )} */}

        {/* Próximo Evento */}
        <View className="flex-row items-center justify-between mb-2 mt-3">
          <Text style={{ fontWeight: "bold", fontSize: 16, color: "#111827" }}>
            Próximo Evento
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("EventsScreen")}
          >
            <Text style={{ fontSize: 13, color: "#888" }}>Ver todos →</Text>
          </TouchableOpacity>
        </View>
        
        {isLoadingEvents ? (
          <View className="py-4 items-center">
            <ActivityIndicator size="small" color="#000" />
          </View>
        ) : nextEvents.length === 0 ? (
          <View className="py-2 items-center">
            <Text style={{ color: "#666" }}>Nenhum evento agendado.</Text>
          </View>
        ) : (
          nextEvents.map((e, idx) => (
            <ScheduleSummaryCard
              key={e.id || `event-${idx}`}
              title={e.title}
              date={formatDateTime(e.start_at)}
              location={e.location || ''}
              onPress={() =>
                  navigation.navigate("EventDetails", {
                    event: e
                  })
              }
            />
          ))
        )}

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
