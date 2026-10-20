import { Text } from "../../components/ui/text";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useRef, useState } from "react";
import { Alert, ScrollView, TouchableOpacity, View } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import HeaderSecondary from "../../components/Header/HeaderSecondary";
import ScheduleSummaryCard from "../../components/schedule/ScheduleSummaryCard";
import ScheduleTeamPanel from "../../components/schedule/ScheduleTeamPanel";
import type { RootStackParamList } from "../../types/navigation";
import {
  deleteSchedule,
  getScheduleAssignmentsDetailed,
  getScheduleDetails,
  type ScheduleAssignmentDetailed,
  type ScheduleDetails,
} from "../../services/scheduleService";
import { useAuthStore } from "../../stores/useAuthStore";
import { useMinistryStore } from "../../stores/useMinistryStore";
import { useScheduleStore } from "../../stores/useScheduleStore";
import { formatDateTime } from "../../utils/formatDate";
import { canManageEvents } from "../../utils/eventPermissions";
import { isEventDateEditable } from "../../utils/scheduleRules";

type EditScheduleRoute = {
  key: string;
  name: "EditSchedule";
  params: RootStackParamList["EditSchedule"];
};

export default function EditScheduleScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<EditScheduleRoute>();
  const { session, profile, sessionRevision } = useAuthStore();
  const { fetchScheduleCards } = useScheduleStore();
  const { userMinistries, fetchUserMinistries } = useMinistryStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingSchedule, setIsDeletingSchedule] = useState(false);

  const [details, setDetails] = useState<ScheduleDetails | null>(null);
  const [assignments, setAssignments] = useState<ScheduleAssignmentDetailed[]>(
    [],
  );

  const isAdmin = profile?.role === "admin";
  const loadRevision = useRef(0);
  const focused = useRef(false);
  const currentScheduleId = useRef(route.params.scheduleId);
  currentScheduleId.current = route.params.scheduleId;
  const [loadError, setLoadError] = useState<string | null>(null);
  const captureVisit = () => {
    const visit = loadRevision.current;
    return () =>
      focused.current &&
      visit === loadRevision.current &&
      sessionRevision === useAuthStore.getState().sessionRevision;
  };
  const hasCurrentManagementPermission = () => {
    const auth = useAuthStore.getState();
    const scope = useMinistryStore.getState();
    return (
      !!details &&
      !!auth.session &&
      auth.session.user.id === session?.user.id &&
      auth.sessionRevision === sessionRevision &&
      (auth.profile?.role === "admin" ||
        (scope.userMinistriesUserId === auth.session.user.id &&
          !scope.error &&
          scope.userMinistries.some(
            (ministry) =>
              ministry.id === details.ministry_id && ministry.is_leader,
          )))
    );
  };

  const loadScreen = useCallback(async () => {
    const request = ++loadRevision.current;
    const authRevision = useAuthStore.getState().sessionRevision;
    const current = () =>
      request === loadRevision.current &&
      authRevision === useAuthStore.getState().sessionRevision;
    setIsLoading(true);
    setLoadError(null);
    setIsDeletingSchedule(false);
    try {
      await fetchUserMinistries(true);
      if (!current()) return;
      const scope = useMinistryStore.getState();
      if (scope.error || scope.userMinistriesUserId !== session?.user.id)
        throw new Error(
          scope.error ?? "Não foi possível confirmar seus ministérios.",
        );
      const scheduleResult = await getScheduleDetails(route.params.scheduleId);
      if (!current()) return;
      if (scheduleResult.error || !scheduleResult.data)
        throw new Error(scheduleResult.error ?? "Escala não encontrada.");
      const assignmentsResult = await getScheduleAssignmentsDetailed(
        scheduleResult.data.id,
      );
      if (!current()) return;
      if (assignmentsResult.error) throw new Error(assignmentsResult.error);
      setDetails(scheduleResult.data);
      setAssignments(assignmentsResult.data ?? []);
    } catch (error) {
      if (current()) {
        setDetails(null);
        setAssignments([]);
        setLoadError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar a escala.",
        );
      }
    } finally {
      if (current()) setIsLoading(false);
    }
  }, [fetchUserMinistries, route.params.scheduleId, isAdmin, session?.user.id]);

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      void loadScreen();
      return () => {
        focused.current = false;
        ++loadRevision.current;
      };
    }, [loadScreen]),
  );

  const refreshHub = useCallback(async () => {
    if (!session?.user?.id) return;

    const auth = useAuthStore.getState();
    const scope = useMinistryStore.getState();
    if (auth.session?.user.id !== session.user.id) return;
    const leaderMinistryIds =
      auth.profile?.role === "admin"
        ? []
        : (scope.userMinistriesUserId === session.user.id && !scope.error
            ? scope.userMinistries
            : []
          )
            .filter((ministry) => ministry.is_leader)
            .map((ministry) => ministry.id);

    await fetchScheduleCards({
      userId: session.user.id,
      viewMode: useScheduleStore.getState().viewMode,
      isAdmin: auth.profile?.role === "admin",
      leaderMinistryIds,
      forceRefresh: true,
    });
  }, [fetchScheduleCards, isAdmin, session?.user?.id, userMinistries]);

  const refreshScheduleAfterChange = async (scheduleId: string) => {
    if (sessionRevision !== useAuthStore.getState().sessionRevision) return;
    if (!focused.current || scheduleId !== currentScheduleId.current) {
      await refreshHub();
      return;
    }
    const visit = loadRevision.current;
    const authRevision = useAuthStore.getState().sessionRevision;
    const { data, error } = await getScheduleAssignmentsDetailed(scheduleId);
    if (
      visit !== loadRevision.current ||
      authRevision !== useAuthStore.getState().sessionRevision ||
      scheduleId !== currentScheduleId.current
    )
      return;
    if (!error) {
      setAssignments(data ?? []);
    }

    await refreshHub();
  };

  // A write can finish after a new visit has already read the old state.
  const discardObsoleteWrite = async (
    current: () => boolean,
    error: string | null,
  ) => {
    if (current()) return false;
    if (
      !error &&
      focused.current &&
      sessionRevision === useAuthStore.getState().sessionRevision
    ) {
      await loadScreen();
      await refreshHub();
    }
    return true;
  };

  const handleDeleteSchedule = () => {
    if (!hasCurrentManagementPermission()) {
      Alert.alert(
        "Sem permissao",
        "Somente admin ou lider deste ministerio pode excluir a escala.",
      );
      return;
    }

    if (details && !isEventDateEditable(details.event.start_at)) {
      Alert.alert(
        "Escala somente leitura",
        "Nao e mais possivel excluir a escala no horario do evento ou depois dele.",
      );
      return;
    }

    if (!details) return;

    const current = captureVisit();
    Alert.alert(
      "Excluir escala",
      "Deseja excluir esta escala? Essa acao remove tambem os membros ja adicionados.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            if (!hasCurrentManagementPermission()) return;
            if (!current()) return;
            if (!isEventDateEditable(details.event.start_at)) {
              Alert.alert("Escala somente leitura", "O evento já começou.");
              return;
            }
            setIsDeletingSchedule(true);
            const { error } = await deleteSchedule(details.id);
            if (await discardObsoleteWrite(current, error)) return;
            setIsDeletingSchedule(false);

            if (error) {
              Alert.alert(
                "Nao foi possivel excluir a escala",
                "A escala nao foi excluida. Tente novamente em alguns instantes.",
              );
              return;
            }

            await refreshHub();
            if (!current()) return;
            Alert.alert(
              "Escala excluida",
              "A escala foi removida com sucesso.",
              [
                {
                  text: "OK",
                  onPress: () =>
                    navigation.navigate("Main", { screen: "Schedules" }),
                },
              ],
            );
          },
        },
      ],
    );
  };

  const canManageSchedule = hasCurrentManagementPermission();
  const isManageReadOnly =
    !details || !isEventDateEditable(details.event.start_at);
  const canManageScheduleActions = canManageSchedule && !isManageReadOnly;

  if (isLoading || !details) {
    return (
      <SafeAreaView
        className="flex-1 bg-white"
        edges={["top", "left", "right"]}
      >
        <HeaderSecondary title="Escala" onBack={() => navigation.goBack()} />
        <View className="flex-1 items-center justify-center px-6">
          <Text style={{ color: "#6b7280" }}>
            {isLoading
              ? "Carregando..."
              : (loadError ?? "Escala não encontrada.")}
          </Text>
          {!isLoading ? (
            <Text onPress={() => void loadScreen()} style={{ padding: 16 }}>
              Tentar novamente
            </Text>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <HeaderSecondary title="Escala" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 32,
          backgroundColor: "#f8fafc",
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 24,
            padding: 18,
            borderWidth: 1,
            borderColor: "#eef2f7",
            shadowColor: "#0f172a",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 2,
            marginBottom: 18,
          }}
        >
          <Text style={{ fontWeight: "700", fontSize: 17, marginBottom: 12 }}>
            Contexto da escala
          </Text>

          <ScheduleSummaryCard
            eventTitle={details.event.title}
            eventDate={formatDateTime(details.event.start_at)}
            eventLocation={details.event.location}
            ministryName={details.ministry.name}
          />
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("EventSetlist", { eventId: details.event.id })
            }
            style={{
              padding: 14,
              backgroundColor: "#f3f4f6",
              borderRadius: 12,
            }}
          >
            <Text>Repertório do evento</Text>
          </TouchableOpacity>
          {canManageEvents(profile) && !isManageReadOnly ? (
            <View style={{ marginTop: 12 }}>
              <Text style={{ color: "#6b7280", marginBottom: 8 }}>
                A data e o local pertencem ao evento e são compartilhados por
                todas as escalas dele.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (!isEventDateEditable(details.event.start_at)) {
                    Alert.alert(
                      "Evento somente leitura",
                      "O evento já começou.",
                    );
                    return;
                  }
                  navigation.navigate("CreateEvent", {
                    mode: "edit",
                    eventId: details.event.id,
                  });
                }}
                style={{
                  padding: 14,
                  backgroundColor: "#f3f4f6",
                  borderRadius: 12,
                }}
              >
                <Text>Editar evento de apoio</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {canManageSchedule ? (
            <TouchableOpacity
              onPress={handleDeleteSchedule}
              disabled={!canManageScheduleActions || isDeletingSchedule}
              activeOpacity={0.85}
              style={{
                marginTop: 12,
                borderRadius: 18,
                padding: 14,
                borderWidth: 1,
                borderColor: "#fecdd3",
                backgroundColor: "#fff1f2",
                opacity:
                  !canManageScheduleActions || isDeletingSchedule ? 0.6 : 1,
              }}
            >
              <Text
                style={{
                  color: "#be123c",
                  fontWeight: "700",
                  textAlign: "center",
                }}
              >
                Excluir escala
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <ScheduleTeamPanel
          details={details}
          assignments={assignments}
          canManage={hasCurrentManagementPermission}
          onChanged={() => refreshScheduleAfterChange(details.id)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
