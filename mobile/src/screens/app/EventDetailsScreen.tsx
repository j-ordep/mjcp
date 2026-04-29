import { Edit } from "lucide-react-native";
import React from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EventInfoCard from "../../components/card/EventInfoCard";
import HeaderSecondary from "../../components/Header/HeaderSecondary";
import type { EventDetailsScreenProps } from "../../navigation/AppNavigator";
import { useAuthStore } from "../../stores/useAuthStore";
import { normalizeEventCategory } from "../../utils/eventCategory";

export default function EventDetailsScreen({
  route,
  navigation,
}: EventDetailsScreenProps) {
  const { event } = route.params;
  const { profile } = useAuthStore();

  const canManageEvents = profile?.role === "admin";

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
                    category: normalizeEventCategory(event.category),
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
          category={event.category}
          startAt={event.start_at}
          endAt={event.end_at}
          location={event.location || "Não informado"}
          description={event.description || "Sem descrição."}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
