import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ShieldAlert } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderSecondary from "../../components/Header/HeaderSecondary";
import ScheduleContextSection from "../../components/schedule/ScheduleContextSection";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import {
  getAllMinistries,
  getUserMinistries,
  type UserMinistry,
} from "../../services/ministryService";
import { createScheduleValidated } from "../../services/scheduleService";
import { useAuthStore } from "../../stores/useAuthStore";
import { useEventStore } from "../../stores/useEventStore";
import { useScheduleStore } from "../../stores/useScheduleStore";
import type { Ministry } from "../../types/models";
import { formatDateTime } from "../../utils/formatDate";

type ManageableMinistry = Ministry | UserMinistry;

export default function CreateScheduleScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profile, session } = useAuthStore();
  const { events, fetchUpcomingEvents } = useEventStore();
  const { fetchScheduleCards } = useScheduleStore();

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingMinistries, setIsLoadingMinistries] = useState(false);
  const [ministries, setMinistries] = useState<ManageableMinistry[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedMinistryId, setSelectedMinistryId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    void fetchUpcomingEvents();
    void loadManageableMinistries();
  }, [fetchUpcomingEvents, profile?.role, session?.user?.id]);

  const loadManageableMinistries = async () => {
    if (!session?.user?.id) return;

    setIsLoadingMinistries(true);
    try {
      if (isAdmin) {
        const { data, error } = await getAllMinistries();
        if (error) throw new Error(error);
        setMinistries(data ?? []);
      } else {
        const { data, error } = await getUserMinistries(session.user.id);
        if (error) throw new Error(error);
        setMinistries((data ?? []).filter((ministry) => ministry.is_leader));
      }
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error.message ?? "Não foi possível carregar ministérios.",
      );
    } finally {
      setIsLoadingMinistries(false);
    }
  };

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId),
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
        "Sem permissão",
        "Apenas admin ou líder de ministério pode criar escala.",
      );
      return;
    }

    if (!selectedEventId || !selectedMinistryId) {
      Alert.alert("Campos obrigatórios", "Selecione evento e ministério.");
      return;
    }

    setIsSaving(true);
    const { error } = await createScheduleValidated({
      eventId: selectedEventId,
      ministryId: selectedMinistryId,
      notes: notes.trim() || null,
    });
    setIsSaving(false);

    if (error) {
      Alert.alert("Não foi possível salvar a escala", error);
      return;
    }

    const leaderMinistryIds = isAdmin
      ? []
      : ministries
          .filter((ministry) => "is_leader" in ministry && ministry.is_leader)
          .map((ministry) => ministry.id);

    await fetchScheduleCards({
      userId: session.user.id,
      isAdmin,
      leaderMinistryIds,
      forceRefresh: true,
    });

    Alert.alert("Escala criada", "Agora você pode abrir a escala na lista para montar a equipe.", [
      {
        text: "OK",
        onPress: () => navigation.navigate("MySchedulesScreen"),
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <HeaderSecondary title="Criar Escala" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 32, backgroundColor: "#f8fafc" }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            backgroundColor: "#111827",
            borderRadius: 24,
            padding: 20,
            marginBottom: 18,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 21, fontWeight: "700", marginBottom: 6 }}>
            Defina o contexto da escala
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.72)", lineHeight: 20 }}>
            Escolha evento, ministério e observações. A montagem da equipe acontece depois, na tela de edição.
          </Text>
        </View>

        {!canCreateSchedule ? (
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
                Sem permissão para criar escala
              </Text>
              <Text style={{ color: "#9a3412" }}>
                Você precisa ser líder de pelo menos um ministério ou admin.
              </Text>
            </View>
          </View>
        ) : null}

        <ScheduleContextSection
          events={events}
          ministries={ministries}
          selectedEventId={selectedEventId}
          selectedMinistryId={selectedMinistryId}
          selectedEvent={selectedEvent}
          selectedMinistry={selectedMinistry}
          notes={notes}
          isLoadingMinistries={isLoadingMinistries}
          isLoadingSchedule={isSaving}
          scheduleId={null}
          onSelectEvent={setSelectedEventId}
          onSelectMinistry={setSelectedMinistryId}
          onChangeNotes={setNotes}
          onSubmit={handleCreateSchedule}
          formatDateTime={formatDateTime}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
