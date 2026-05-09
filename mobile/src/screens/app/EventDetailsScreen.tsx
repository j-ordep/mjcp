import { useFocusEffect } from "@react-navigation/native";
import { Edit } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EventInfoCard from "../../components/card/EventInfoCard";
import HeaderSecondary from "../../components/Header/HeaderSecondary";
import type { EventDetailsScreenProps } from "../../navigation/AppNavigator";
import { getEventById } from "../../services/eventService";
import { useAuthStore } from "../../stores/useAuthStore";
import {
  toEventEditorInitialData,
  toInformationalEventViewModel,
} from "../../utils/eventPresentation";

export default function EventDetailsScreen({
  route,
  navigation,
}: EventDetailsScreenProps) {
  const [event, setEvent] = useState(route.params.event);
  const { profile } = useAuthStore();

  const canManageEvents = profile?.role === "admin";

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const hydrateEvent = async () => {
        const result = await getEventById(route.params.event.id);
        if (!isMounted || result.error || !result.data) {
          return;
        }

        setEvent(result.data);
      };

      void hydrateEvent();

      return () => {
        isMounted = false;
      };
    }, [route.params.event.id]),
  );

  const viewModel = toInformationalEventViewModel(event);

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
                  initialData: toEventEditorInitialData(event),
                })
            : undefined
        }
      />

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <EventInfoCard
          title={viewModel.title}
          category={viewModel.category}
          startAt={viewModel.startAt}
          endAt={viewModel.endAt}
          location={viewModel.location}
          description={viewModel.description}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

