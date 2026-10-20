import { Text } from "../../components/ui/text";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ShieldAlert } from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import { Alert, ScrollView, View } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import HeaderSecondary from "../../components/Header/HeaderSecondary";
import ScheduleContextSection from "../../components/schedule/ScheduleContextSection";
import type { RootStackParamList } from "../../types/navigation";
import {
  getManageableMinistries,
  type UserMinistry,
} from "../../services/ministryService";
import { createScheduleValidated } from "../../services/scheduleService";
import { useAuthStore } from "../../stores/useAuthStore";
import { useEventStore } from "../../stores/useEventStore";
import { useScheduleStore } from "../../stores/useScheduleStore";
import type { Ministry } from "../../types/models";
import { formatDateTime } from "../../utils/formatDate";
import { isEventDateEditable } from "../../utils/scheduleRules";
import { canManageEvents } from "../../utils/eventPermissions";

type ManageableMinistry = Ministry | UserMinistry;

export default function CreateScheduleScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profile, session } = useAuthStore();
  const { events, fetchUpcomingEvents, isLoadingEvents, error: eventError } = useEventStore();
  const { fetchScheduleCards } = useScheduleStore();

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingMinistries, setIsLoadingMinistries] = useState(false);
  const [ministries, setMinistries] = useState<ManageableMinistry[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedMinistryId, setSelectedMinistryId] = useState<string | null>(null);

  const isAdmin = profile?.role === "admin";
  const loadRevision = useRef(0);
  const [ministryError, setMinistryError] = useState<string | null>(null);
  const upcomingEvents = events.filter((event) => isEventDateEditable(event.start_at));

  const loadContext = useCallback(async () => {
    if (!session?.user.id) return;
    const request = ++loadRevision.current;
    const authRevision = useAuthStore.getState().sessionRevision;
    const current = () => request === loadRevision.current && authRevision === useAuthStore.getState().sessionRevision;
    setIsLoadingMinistries(true);
    setIsSaving(false);
    setMinistryError(null);
    try {
      const [result] = await Promise.all([
        getManageableMinistries({ userId: session.user.id, isAdmin }),
        fetchUpcomingEvents(true),
      ]);
      if (!current()) return;
      if (result.error) {
        setMinistries([]);
        setMinistryError(result.error);
      } else {
        const next = result.data ?? [];
        setMinistries(next);
        setSelectedMinistryId((id) => next.some((ministry) => ministry.id === id) ? id : null);
      }
      const available = useEventStore.getState().events.filter((event) => isEventDateEditable(event.start_at));
      setSelectedEventId((id) => available.some((event) => event.id === id) ? id : null);
    } finally {
      if (current()) setIsLoadingMinistries(false);
    }
  }, [session?.user.id, isAdmin, fetchUpcomingEvents]);
  useFocusEffect(useCallback(() => {
    void loadContext();
    return () => { ++loadRevision.current; };
  }, [loadContext]));

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId && isEventDateEditable(event.start_at)),
    [events, selectedEventId],
  );
  const selectedMinistry = useMemo(
    () => ministries.find((ministry) => ministry.id === selectedMinistryId),
    [ministries, selectedMinistryId],
  );

  const canCreateSchedule = useMemo(() => {
    if (isAdmin) return true;
    return ministries.some((ministry) => "is_leader" in ministry && ministry.is_leader);
  }, [isAdmin, ministries]);

  const handleCreateSchedule = async () => {
    if (!session?.user?.id) return;

    if (!canCreateSchedule) {
      Alert.alert(
        "Sem permissao",
        "Apenas admin ou lider de ministerio pode criar escala.",
      );
      return;
    }

    if (!selectedEvent || !isEventDateEditable(selectedEvent.start_at) || !selectedMinistry || isLoadingMinistries || isLoadingEvents || ministryError || eventError || isSaving) {
      Alert.alert("Campos obrigatorios", "Selecione evento e ministerio.");
      return;
    }

    setIsSaving(true);
    const authRevision = useAuthStore.getState().sessionRevision;
    const visit = loadRevision.current;
    const { data, error } = await createScheduleValidated({
      eventId: selectedEvent.id,
      ministryId: selectedMinistry.id,
    });
    if (authRevision !== useAuthStore.getState().sessionRevision) return;
    const currentVisit = visit === loadRevision.current;
    if (currentVisit) setIsSaving(false);

    if (error || !data?.id) {
      if (!currentVisit) return;
      Alert.alert(
        "Nao foi possivel salvar a escala",
        "Tente novamente em alguns instantes.",
      );
      return;
    }

    const leaderMinistryIds = isAdmin
      ? []
      : ministries
          .filter((ministry) => "is_leader" in ministry && ministry.is_leader)
          .map((ministry) => ministry.id);

    await fetchScheduleCards({
      userId: session.user.id,
      viewMode: useScheduleStore.getState().viewMode,
      isAdmin,
      leaderMinistryIds,
      forceRefresh: true,
    });

    if (authRevision === useAuthStore.getState().sessionRevision && visit === loadRevision.current) navigation.replace("EditSchedule", { scheduleId: data.id });
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <HeaderSecondary title="Criar Escala" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 32, backgroundColor: "#f8fafc" }}
        showsVerticalScrollIndicator={false}
      >
        {!isLoadingMinistries && !ministryError && !canCreateSchedule ? (
          <View
            style={{
              backgroundColor: "#fff7ed",
              borderColor: "#fdba74",
              borderWidth: 1,
              borderRadius: 18,
              padding: 14,
              marginBottom: 18,
              flexDirection: "row",
              gap: 10,
            }}
          >
            <ShieldAlert size={20} color="#c2410c" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#9a3412", fontWeight: "600", marginBottom: 2 }}>
                Sem permissao para criar escala
              </Text>
              <Text style={{ color: "#9a3412" }}>
                Voce precisa ser lider de pelo menos um ministerio ou admin.
              </Text>
            </View>
          </View>
        ) : null}

        {isLoadingEvents ? <Text>Carregando eventos...</Text> : eventError || ministryError ? (
          <View style={{ marginBottom: 18 }}>
            <Text>Não foi possível carregar o contexto. {eventError || ministryError}</Text>
            <Text onPress={() => void loadContext()} style={{ paddingVertical: 12 }}>Tentar novamente</Text>
          </View>
        ) : upcomingEvents.length === 0 ? (
          <View style={{ marginBottom: 18 }}>
            <Text>Nenhum evento futuro disponível. Solicite um evento a um responsável autorizado.</Text>
            {canManageEvents(profile) ? <Text onPress={() => navigation.navigate("EventsScreen")} style={{ paddingVertical: 12 }}>Eventos de apoio</Text> : null}
          </View>
        ) : null}
        <ScheduleContextSection
          events={upcomingEvents}
          ministries={ministries}
          selectedEventId={selectedEventId}
          selectedMinistryId={selectedMinistryId}
          selectedEvent={selectedEvent}
          selectedMinistry={selectedMinistry}
          isLoadingMinistries={isLoadingMinistries}
          isLoadingSchedule={isSaving}
          submitDisabled={isLoadingMinistries || isLoadingEvents || !!ministryError || !!eventError || !selectedEvent || !selectedMinistry || !canCreateSchedule}
          scheduleId={null}
          onSelectEvent={setSelectedEventId}
          onSelectMinistry={setSelectedMinistryId}
          onSubmit={handleCreateSchedule}
          formatDateTime={formatDateTime}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
