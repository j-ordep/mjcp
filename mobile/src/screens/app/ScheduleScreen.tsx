import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ArrowRight, Plus, RefreshCcw, Search } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  TouchableOpacity,
  View,
} from "react-native";
import { Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import EventCard from "../../components/card/EventCard";
import HeaderSecondary from "../../components/Header/HeaderSecondary";
import RequestSwapModal, {
  type SwapAssignmentOption,
} from "../../components/schedule/RequestSwapModal";
import { RootStackParamList } from "../../navigation/AppNavigator";
import {
  cancelOwnSwapRequest,
  confirmMyAssignmentsForSchedule,
  createSwapRequest,
  getOwnPendingSwapRequestForAssignments,
  getOwnPendingSwapRequestsForAssignments,
  getSwapCandidatesForAssignment,
  type SwapCandidateOption,
  type ScheduleCard,
} from "../../services/scheduleService";
import { useAuthStore } from "../../stores/useAuthStore";
import { useMinistryStore } from "../../stores/useMinistryStore";
import { useScheduleStore } from "../../stores/useScheduleStore";
import { formatDateTime } from "../../utils/formatDate";
import {
  getParticipationStatusLabel,
  getOwnRoleLabel,
  hasConfirmableAssignments,
} from "../../utils/scheduleParticipation";
import { isEventDateReadOnly } from "../../utils/scheduleRules";

type Filter = "current" | "past";

export default function ScheduleScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeFilter, setActiveFilter] = useState<Filter>("current");
  const [search, setSearch] = useState("");
  const [isSwapModalVisible, setIsSwapModalVisible] = useState(false);
  const [isSavingSwapRequest, setIsSavingSwapRequest] = useState(false);
  const [swapReason, setSwapReason] = useState("");
  const [selectedSwapAssignmentId, setSelectedSwapAssignmentId] = useState<string | null>(null);
  const [swapAssignments, setSwapAssignments] = useState<SwapAssignmentOption[]>([]);
  const [swapCandidates, setSwapCandidates] = useState<SwapCandidateOption[]>([]);
  const [pendingSwapRequestByAssignmentId, setPendingSwapRequestByAssignmentId] = useState<
    Record<string, string>
  >({});

  const { profile, session } = useAuthStore();
  const { userMinistries, fetchUserMinistries, isLoadingMinistries } =
    useMinistryStore();
  const { scheduleCards, viewMode, isLoadingSchedules, fetchScheduleCards } =
    useScheduleStore();

  const isAdmin = profile?.role === "admin";
  const leaderMinistryIds = useMemo(
    () =>
      userMinistries
        .filter((ministry) => ministry.is_leader)
        .map((ministry) => ministry.id),
    [userMinistries],
  );
  const hasManageableScope = isAdmin || leaderMinistryIds.length > 0;
  const canCreate = hasManageableScope;

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const load = async () => {
        if (!session?.user?.id) return;

        await fetchUserMinistries(true);
        if (!isActive) return;

        const refreshedUserMinistries = useMinistryStore.getState().userMinistries;
        const refreshedLeaderMinistryIds = refreshedUserMinistries
          .filter((ministry) => ministry.is_leader)
          .map((ministry) => ministry.id);

        await fetchScheduleCards({
          userId: session.user.id,
          isAdmin,
          leaderMinistryIds: isAdmin ? [] : refreshedLeaderMinistryIds,
          forceRefresh: true,
        });
      };

      void load();

      return () => {
        isActive = false;
      };
    }, [fetchScheduleCards, fetchUserMinistries, isAdmin, session?.user?.id]),
  );

  const filteredSchedules = useMemo(() => {
    const now = new Date().getTime();
    const normalizedSearch = search.trim().toLowerCase();

    return scheduleCards.filter((schedule) => {
      const eventTime = new Date(schedule.event.start_at).getTime();
      const matchesFilter =
        activeFilter === "current" ? eventTime >= now : eventTime < now;
      const matchesSearch =
        !normalizedSearch ||
        schedule.event.title.toLowerCase().includes(normalizedSearch) ||
        schedule.ministry.name.toLowerCase().includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, scheduleCards, search]);

  const filters: { key: Filter; label: string }[] = useMemo(
    () => [
      { key: "current", label: "Proximas" },
      { key: "past", label: "Anteriores" },
    ],
    [],
  );

  const loadSwapCandidates = useCallback(async (assignmentId: string | null) => {
    if (!assignmentId) {
      setSwapCandidates([]);
      return;
    }

    const { data, error } = await getSwapCandidatesForAssignment(assignmentId);
    if (error) {
      Alert.alert("Nao foi possivel carregar candidatos", error);
      setSwapCandidates([]);
      return;
    }

    setSwapCandidates(data ?? []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      const loadPendingSwapRequests = async () => {
        const assignmentIds = scheduleCards.flatMap((schedule) =>
          schedule.my_assignments.map((assignment) => assignment.id),
        );

        const { data, error } = await getOwnPendingSwapRequestsForAssignments(assignmentIds);
        if (error) {
          setPendingSwapRequestByAssignmentId({});
          return;
        }

        const nextMap = Object.fromEntries(
          (data ?? []).map((request) => [request.from_assignment_id, request.id]),
        );
        setPendingSwapRequestByAssignmentId(nextMap);
      };

      void loadPendingSwapRequests();
    }, [scheduleCards]),
  );

  const handleOpenSwapForAssignments = useCallback(
    async (assignments: SwapAssignmentOption[]) => {
      if (assignments.length === 0) return;

      const { data: pendingRequest, error } =
        await getOwnPendingSwapRequestForAssignments(
          assignments.map((assignment) => assignment.id),
        );

      if (error) {
        Alert.alert("Nao foi possivel verificar a troca", error);
        return;
      }

      if (pendingRequest) {
        setPendingSwapRequestByAssignmentId((current) => ({
          ...current,
          [pendingRequest.from_assignment_id]: pendingRequest.id,
        }));
        return;
      }

      setSwapAssignments(assignments);
      const nextAssignmentId = assignments[0]?.id ?? null;
      setSelectedSwapAssignmentId(nextAssignmentId);
      void loadSwapCandidates(nextAssignmentId);
      setSwapReason("");
      setIsSwapModalVisible(true);
    },
    [loadSwapCandidates],
  );

  const renderItem = useCallback(
    ({ item }: { item: ScheduleCard }) => {
      const roleLabel =
        item.my_assignments.length > 0
          ? getOwnRoleLabel(item.my_assignments)
          : undefined;
      const showOwnActions = item.my_assignments.length > 0;
      const hasPendingOwnAssignments = hasConfirmableAssignments(item.my_assignments);
      const participationStatusLabel = getParticipationStatusLabel(item.my_assignments);
      const isReadOnly = isEventDateReadOnly(item.event.start_at);
      const pendingOwnSwapRequestId =
        item.my_assignments
          .map((assignment) => pendingSwapRequestByAssignmentId[assignment.id])
          .find(Boolean) ?? null;
      const hasPendingOwnSwapRequest = !!pendingOwnSwapRequestId;
      const confirmDisabled = isReadOnly || !hasPendingOwnAssignments;
      const swapDisabled = isReadOnly;
      const actionHint = isReadOnly
        ? "Escala encerrada. Nao e mais possivel confirmar ou solicitar troca."
        : hasPendingOwnSwapRequest
          ? "Troca pendente para esta escala."
          : undefined;

      return (
        <EventCard
          title={item.event.title}
          date={formatDateTime(item.event.start_at)}
          location={item.event.location ?? undefined}
          description={item.event.description || undefined}
          department={item.ministry.name}
          role={roleLabel || undefined}
          showActions={showOwnActions}
          swapLabel={hasPendingOwnSwapRequest ? "Cancelar troca" : "Preciso trocar"}
          swapVariant={hasPendingOwnSwapRequest ? "destructive" : "outline"}
          confirmLabel={hasPendingOwnAssignments ? "Confirmar presenca" : "Presenca confirmada"}
          confirmDisabled={confirmDisabled}
          swapDisabled={swapDisabled}
          actionHint={actionHint}
          participationStatusLabel={participationStatusLabel}
          onDetails={() => {
            navigation.navigate("EditSchedule", {
              scheduleId: item.id,
            });
          }}
          onSwap={() => {
            if (hasPendingOwnSwapRequest && pendingOwnSwapRequestId) {
              void (async () => {
                const { error } = await cancelOwnSwapRequest(pendingOwnSwapRequestId);
                if (error) {
                  Alert.alert("Nao foi possivel cancelar", error);
                  return;
                }

                setPendingSwapRequestByAssignmentId((current) => {
                  const next = { ...current };
                  for (const assignment of item.my_assignments) {
                    delete next[assignment.id];
                  }
                  return next;
                });

                if (session?.user?.id) {
                  await fetchScheduleCards({
                    userId: session.user.id,
                    isAdmin,
                    leaderMinistryIds,
                    forceRefresh: true,
                  });
                }
              })();
              return;
            }

            void handleOpenSwapForAssignments(item.my_assignments);
          }}
          onConfirm={async () => {
            if (!session?.user?.id || !hasPendingOwnAssignments) return;

            const { error } = await confirmMyAssignmentsForSchedule({
              scheduleId: item.id,
              userId: session.user.id,
            });

            if (error) {
              Alert.alert("Nao foi possivel confirmar", error);
              return;
            }

            await fetchScheduleCards({
              userId: session.user.id,
              isAdmin,
              leaderMinistryIds,
              forceRefresh: true,
            });
          }}
        />
      );
    },
    [
      fetchScheduleCards,
      handleOpenSwapForAssignments,
      isAdmin,
      leaderMinistryIds,
      navigation,
      pendingSwapRequestByAssignmentId,
      session?.user?.id,
    ],
  );

  const keyExtractor = useCallback((item: ScheduleCard) => item.id, []);

  const ListEmpty = useCallback(() => {
    if (isLoadingSchedules || isLoadingMinistries) return null;

    return (
      <View className="items-center justify-center py-16 px-10">
        <Text style={{ color: "#888", fontSize: 16, textAlign: "center" }}>
          {viewMode === "manageable"
            ? "Nenhuma escala gerenciavel encontrada."
            : "Nenhuma escala pessoal encontrada."}
        </Text>
      </View>
    );
  }, [isLoadingMinistries, isLoadingSchedules, viewMode]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <HeaderSecondary
        title="Escalas"
        onBack={() => navigation.goBack()}
        rightIcon={canCreate ? <Plus size={22} color="#000" /> : undefined}
        onRightPress={() => navigation.navigate("CreateSchedule")}
      />

      <View className="px-5">
        <TouchableOpacity
          onPress={() => navigation.navigate("SwapRequests")}
          activeOpacity={0.85}
          style={{
            marginBottom: 14,
            borderRadius: 20,
            padding: 16,
            backgroundColor: "#eef6ff",
            borderWidth: 1,
            borderColor: "#bfdbfe",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#dbeafe",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <RefreshCcw size={18} color="#1d4ed8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "700", color: "#111827", marginBottom: 4 }}>
                  Trocas de escala
                </Text>
                <Text style={{ color: "#475569" }}>
                  Acompanhe as solicitações de trocas
                </Text>
              </View>
            </View>
            <ArrowRight size={18} color="#1d4ed8" />
          </View>
        </TouchableOpacity>

        <View className="flex-row items-center bg-gray-100 rounded-xl border border-gray-200 px-3 mb-4">
          <Search size={18} color="#888" />
          <TextInput
            placeholder="Buscar escala..."
            value={search}
            onChangeText={setSearch}
            style={{
              flex: 1,
              backgroundColor: "transparent",
              fontSize: 15,
              height: 44,
            }}
            underlineColor="transparent"
            activeUnderlineColor="transparent"
          />
        </View>

        <View className="flex-row gap-2 mb-4">
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              onPress={() => setActiveFilter(filter.key)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 18,
                borderRadius: 10,
                backgroundColor: activeFilter === filter.key ? "#000" : "#f3f4f6",
                borderWidth: activeFilter === filter.key ? 0 : 1,
                borderColor: "#e5e7eb",
              }}
            >
              <Text
                style={{
                  color: activeFilter === filter.key ? "#fff" : "#222",
                  fontWeight: activeFilter === filter.key ? "bold" : "normal",
                  fontSize: 14,
                }}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoadingSchedules || (profile?.role === "leader" && isLoadingMinistries) ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <FlatList
          data={filteredSchedules}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 32,
            paddingTop: 4,
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={ListEmpty}
        />
      )}

      <RequestSwapModal
        visible={isSwapModalVisible}
        title="Escolha qual funcao desta escala voce precisa trocar."
        assignments={swapAssignments}
        candidates={swapCandidates}
        selectedAssignmentId={selectedSwapAssignmentId}
        reason={swapReason}
        isSaving={isSavingSwapRequest}
        onClose={() => setIsSwapModalVisible(false)}
        onSelectAssignment={(assignmentId) => {
          setSelectedSwapAssignmentId(assignmentId);
          void loadSwapCandidates(assignmentId);
        }}
        onChangeReason={setSwapReason}
        onSubmit={async () => {
          if (!selectedSwapAssignmentId) return;

          setIsSavingSwapRequest(true);
          const { data, error } = await createSwapRequest({
            fromAssignmentId: selectedSwapAssignmentId,
            reason: swapReason,
          });
          setIsSavingSwapRequest(false);

          if (error) {
            Alert.alert("Nao foi possivel solicitar troca", error);
            return;
          }

          setIsSwapModalVisible(false);
          setSelectedSwapAssignmentId(null);
          setSwapReason("");
          setPendingSwapRequestByAssignmentId((current) => {
            if (!data?.id) return current;
            return {
              ...current,
              [selectedSwapAssignmentId]: data.id,
            };
          });
          if (session?.user?.id) {
            await fetchScheduleCards({
              userId: session.user.id,
              isAdmin,
              leaderMinistryIds,
              forceRefresh: true,
            });
          }
        }}
      />
    </SafeAreaView>
  );
}
