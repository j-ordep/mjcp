import { Edit, Info, Users } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, View } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import DefaultButton from "../../components/button/DefaultButton";
import EventInfoCard from "../../components/card/EventInfoCard";
import MemberCard from "../../components/card/MemberCard";
import TeamStatusCard from "../../components/card/TeamStatusCard";
import HeaderSecondary from "../../components/Header/HeaderSecondary";
import RequestSwapModal from "../../components/schedule/RequestSwapModal";
import type { EventDetailsScreenProps } from "../../navigation/AppNavigator";
import {
  type AssignmentWithDetails,
  cancelOwnSwapRequest,
  confirmMyAssignmentsForSchedule,
  createSwapRequest,
  getAssignmentsByEvent,
  getOwnPendingSwapRequestForAssignments,
  getSwapCandidatesForAssignment,
  type SwapCandidateOption,
} from "../../services/scheduleService";
import { useAuthStore } from "../../stores/useAuthStore";
import { formatDateShort, formatTime } from "../../utils/formatDate";
import {
  getParticipationStatusLabel,
  hasConfirmableAssignments,
} from "../../utils/scheduleParticipation";
import { isEventDateReadOnly } from "../../utils/scheduleRules";

export default function EventDetailsScreen({
  route,
  navigation,
}: EventDetailsScreenProps) {
  const { event } = route.params;
  const { profile, session } = useAuthStore();

  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmingPresence, setIsConfirmingPresence] = useState(false);
  const [isSwapModalVisible, setIsSwapModalVisible] = useState(false);
  const [isSubmittingSwap, setIsSubmittingSwap] = useState(false);
  const [selectedOwnAssignmentId, setSelectedOwnAssignmentId] = useState<string | null>(null);
  const [swapCandidates, setSwapCandidates] = useState<SwapCandidateOption[]>([]);
  const [swapReason, setSwapReason] = useState("");
  const [pendingOwnSwapRequestId, setPendingOwnSwapRequestId] = useState<string | null>(null);

  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    void fetchAssignments();
  }, [event.id]);

  const fetchAssignments = async () => {
    setIsLoading(true);
    const { data, error } = await getAssignmentsByEvent(event.id);
    if (!error && data) {
      setAssignments(data);
    }
    setIsLoading(false);
  };

  const myAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.user_id === session?.user?.id),
    [assignments, session?.user?.id],
  );
  const selectedOwnAssignment =
    myAssignments.find((assignment) => assignment.id === selectedOwnAssignmentId) ??
    myAssignments[0] ??
    null;
  const isAssigned = myAssignments.length > 0;
  const myScheduleIds = Array.from(new Set(myAssignments.map((assignment) => assignment.schedule_id)));
  const hasPendingOwnAssignments = hasConfirmableAssignments(
    myAssignments.map((assignment) => ({
      id: assignment.id,
      user_id: assignment.user_id,
      role_id: assignment.role_id,
      role_name: assignment.ministry_roles?.[0]?.name ?? "Funcao",
      status: assignment.status,
    })),
  );
  const participationStatusLabel = getParticipationStatusLabel(myAssignments);
  const myRole = myAssignments
    .map((assignment) => assignment.ministry_roles?.[0]?.name)
    .filter(Boolean)
    .join(", ");
  const myMinistry = selectedOwnAssignment?.ministry_roles?.[0]?.ministries?.[0]?.name;
  const confirmedCount = assignments.filter((assignment) => assignment.status === "confirmed").length;
  const totalCount = assignments.length;
  const isOwnParticipationReadOnly = isEventDateReadOnly(event.start_at);
  const ownParticipationHint = isOwnParticipationReadOnly
    ? "Escala encerrada. Nao e mais possivel confirmar ou solicitar troca."
    : pendingOwnSwapRequestId
      ? "Troca pendente para esta escala."
      : undefined;

  useEffect(() => {
    if (!selectedOwnAssignmentId && myAssignments.length > 0) {
      setSelectedOwnAssignmentId(myAssignments[0].id);
    }
  }, [myAssignments, selectedOwnAssignmentId]);

  useEffect(() => {
    const loadCandidates = async () => {
      if (!selectedOwnAssignmentId) {
        setSwapCandidates([]);
        return;
      }

      const { data, error } = await getSwapCandidatesForAssignment(selectedOwnAssignmentId);
      if (error) {
        Alert.alert("Nao foi possivel carregar candidatos", error);
        setSwapCandidates([]);
        return;
      }

      setSwapCandidates(data ?? []);
    };

    void loadCandidates();
  }, [selectedOwnAssignmentId]);

  useEffect(() => {
    const loadPendingOwnSwapRequest = async () => {
      const { data, error } = await getOwnPendingSwapRequestForAssignments(
        myAssignments.map((assignment) => assignment.id),
      );

      if (error) {
        setPendingOwnSwapRequestId(null);
        return;
      }

      setPendingOwnSwapRequestId(data?.id ?? null);
    };

    void loadPendingOwnSwapRequest();
  }, [myAssignments]);

  const handleConfirmPresence = async () => {
    if (!selectedOwnAssignment || !session?.user?.id) return;

    if (myScheduleIds.length > 1) {
      Alert.alert(
        "Confirme pela escala",
        "Voce esta em mais de uma escala neste evento. Confirme a presenca pela tela da escala correspondente.",
      );
      return;
    }

    setIsConfirmingPresence(true);
    const { error } = await confirmMyAssignmentsForSchedule({
      scheduleId: selectedOwnAssignment.schedule_id,
      userId: session.user.id,
    });
    setIsConfirmingPresence(false);

    if (error) {
      Alert.alert("Nao foi possivel confirmar", error);
      return;
    }

    await fetchAssignments();
  };

  const handleOpenSwapModal = () => {
    if (myAssignments.length === 0) return;

    void (async () => {
      const { data: pendingRequest, error } = await getOwnPendingSwapRequestForAssignments(
        myAssignments.map((assignment) => assignment.id),
      );

      if (error) {
        Alert.alert("Nao foi possivel verificar a troca", error);
        return;
      }

      if (pendingRequest) {
        setPendingOwnSwapRequestId(pendingRequest.id);
        return;
      }

      setSelectedOwnAssignmentId((current) => current ?? myAssignments[0].id);
      setSwapReason("");
      setIsSwapModalVisible(true);
    })();
  };

  const handleSubmitSwapRequest = async () => {
    if (!selectedOwnAssignment) return;

    setIsSubmittingSwap(true);
    const { data, error } = await createSwapRequest({
      fromAssignmentId: selectedOwnAssignment.id,
      reason: swapReason,
    });
    setIsSubmittingSwap(false);

    if (error) {
      Alert.alert("Nao foi possivel solicitar a troca", error);
      return;
    }

    setIsSwapModalVisible(false);
    setPendingOwnSwapRequestId(data?.id ?? null);
    setAssignments((current) =>
      current.map((assignment) =>
        assignment.id === selectedOwnAssignment.id
          ? { ...assignment, status: "pending" }
          : assignment,
      ),
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#fff" }}
      edges={["top", "left", "right"]}
    >
      <HeaderSecondary
        title="Detalhes"
        onBack={() => navigation.goBack()}
        rightIcon={isAdmin ? <Edit size={22} color="#000" /> : undefined}
        onRightPress={
          isAdmin
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
          isAssigned={isAssigned}
          department={myMinistry}
          role={myRole || undefined}
        />

        {isLoading ? (
          <ActivityIndicator
            size="small"
            color="#000"
            style={{ marginVertical: 20 }}
          />
        ) : assignments.length > 0 ? (
          <View style={{ marginBottom: 24 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                Equipe escalada
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Users size={16} color="#888" style={{ marginRight: 4 }} />
                <Text style={{ color: "#888", fontSize: 14 }}>
                  {confirmedCount}/{totalCount} confirmados
                </Text>
              </View>
            </View>

            <TeamStatusCard
              confirmed={confirmedCount}
              pending={totalCount - confirmedCount}
            />

            <View style={{ gap: 10, marginTop: 15 }}>
              {assignments.map((assignment) => (
                <MemberCard
                  key={assignment.id}
                  name={assignment.profiles?.[0]?.full_name || "Membro"}
                  role={assignment.ministry_roles?.[0]?.name || "Vaga"}
                  photo={assignment.profiles?.[0]?.avatar_url ?? undefined}
                  confirmed={assignment.status === "confirmed"}
                />
              ))}
            </View>
          </View>
        ) : (
          <View
            style={{
              padding: 20,
              alignItems: "center",
              backgroundColor: "#f9fafb",
              borderRadius: 16,
              marginBottom: 24,
            }}
          >
            <Info size={24} color="#666" style={{ marginBottom: 8 }} />
            <Text style={{ color: "#666", textAlign: "center" }}>
              Este evento ainda nao possui uma equipe escalada.
            </Text>
          </View>
        )}

        {isAssigned ? (
          <>
            <Text style={{ color: "#6b7280", fontSize: 13, marginBottom: 10 }}>
              Status da participacao: {participationStatusLabel}
            </Text>

            <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
              <View style={{ flex: 1 }}>
                <DefaultButton
                  variant={pendingOwnSwapRequestId ? "destructive" : "outline"}
                  disabled={isOwnParticipationReadOnly}
                  onPress={() => {
                    if (!pendingOwnSwapRequestId) {
                      handleOpenSwapModal();
                      return;
                    }

                    void (async () => {
                      const { error } = await cancelOwnSwapRequest(
                        pendingOwnSwapRequestId,
                      );
                      if (error) {
                        Alert.alert("Nao foi possivel cancelar", error);
                        return;
                      }

                      setPendingOwnSwapRequestId(null);
                      await fetchAssignments();
                    })();
                  }}
                >
                  {pendingOwnSwapRequestId ? "Cancelar troca" : "Preciso trocar"}
                </DefaultButton>
              </View>
              <View style={{ flex: 1 }}>
                <DefaultButton
                  variant="primary"
                  onPress={handleConfirmPresence}
                  isLoading={isConfirmingPresence}
                  disabled={isOwnParticipationReadOnly || !hasPendingOwnAssignments}
                >
                  {hasPendingOwnAssignments ? "Confirmar presenca" : "Presenca confirmada"}
                </DefaultButton>
              </View>
            </View>

            {ownParticipationHint ? (
              <Text style={{ color: "#6b7280", fontSize: 13, marginBottom: 24 }}>
                {ownParticipationHint}
              </Text>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      <RequestSwapModal
        visible={isSwapModalVisible}
        title="Escolha qual funcao desta escala voce precisa trocar."
        assignments={myAssignments.map((assignment) => ({
          id: assignment.id,
          role_name: assignment.ministry_roles?.[0]?.name ?? "Funcao",
        }))}
        candidates={swapCandidates}
        selectedAssignmentId={selectedOwnAssignmentId}
        reason={swapReason}
        isSaving={isSubmittingSwap}
        onClose={() => setIsSwapModalVisible(false)}
        onSelectAssignment={setSelectedOwnAssignmentId}
        onChangeReason={setSwapReason}
        onSubmit={handleSubmitSwapRequest}
      />
    </SafeAreaView>
  );
}
