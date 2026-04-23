import { Edit } from "lucide-react-native";
import React from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EventInfoCard from "../../components/card/EventInfoCard";
import HeaderSecondary from "../../components/Header/HeaderSecondary";
import type { EventDetailsScreenProps } from "../../navigation/AppNavigator";
import { useAuthStore } from "../../stores/useAuthStore";
import { formatDateShort, formatTime } from "../../utils/formatDate";

export default function EventDetailsScreen({
  route,
  navigation,
}: EventDetailsScreenProps) {
  const { event } = route.params;
  const { profile } = useAuthStore();

  const canManageEvents = profile?.role === "admin" || profile?.role === "leader";

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#fff" }}
      edges={["top", "left", "right"]}
    >
      <HeaderSecondary
        title="Detalhes"
        onBack={() => navigation.goBack()}
        rightIcon={canManageEvents ? <Edit size={22} color="#000" /> : undefined}
        onRightPress={
          canManageEvents
            ? () =>
                navigation.navigate("CreateEvent", {
                  mode: "edit",
                  eventId: event.id,
                  initialData: {
                    ...event,
                    end_at: event.end_at ?? null,
                    is_public: event.is_public ?? true,
                  },
                })
            : undefined
        }
      />

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <EventInfoCard
          title={event.title}
          date={formatDateShort(event.start_at)}
          time={formatTime(event.start_at)}
          location={event.location || "Nao informado"}
          description={event.description || "Sem descricao."}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
