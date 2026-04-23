import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Trash2 } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import DefaultButton from "../../components/button/DefaultButton";
import HeaderSecondary from "../../components/Header/HeaderSecondary";
import AssignmentPickerModal from "../../components/schedule/AssignmentPickerModal";
import RequestSwapModal from "../../components/schedule/RequestSwapModal";
import ScheduleSummaryCard from "../../components/schedule/ScheduleSummaryCard";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import {
  cancelOwnSwapRequest,
  confirmMyAssignmentsForSchedule,
  createSwapRequest,
  deleteSchedule,
  getAssignmentWarningsForSchedule,
  getMinistryMembersOptions,
  getMinistryRolesOptions,
  getScheduleAssignmentsDetailed,
  getScheduleDetails,
  getOwnPendingSwapRequestForAssignments,
  removeScheduleAssignment,
  getSwapCandidatesForAssignment,
  type MinistryMemberOption,
  type MinistryRoleOption,
  type ScheduleAssignmentDetailed,
  type SwapCandidateOption,
  upsertScheduleAssignmentValidated,
} from "../../services/scheduleService";
import { useAuthStore } from "../../stores/useAuthStore";
import { useMinistryStore } from "../../stores/useMinistryStore";
import { useScheduleStore } from "../../stores/useScheduleStore";
import { formatDateTime } from "../../utils/formatDate";
import {
  getParticipationStatusLabel,
  getOwnAssignments,
  getOwnRoleLabel,
  hasConfirmableAssignments,
} from "../../utils/scheduleParticipation";
import {
  buildAssignmentWarningsMessage,
  isEventDateEditable,
  isEventDateReadOnly,
} from "../../utils/scheduleRules";
import { getAssignmentStatusLabel } from "../../utils/statusLabels";

type EditScheduleRoute = {
  key: string;
  name: "EditSchedule";
  params: RootStackParamList["EditSchedule"];
};

export default function EditScheduleScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<EditScheduleRoute>();
  const { session, profile } = useAuthStore();
  const { fetchScheduleCards } = useScheduleStore();
  const { userMinistries, fetchUserMinistries } = useMinistryStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);
  const [isConfirmingPresence, setIsConfirmingPresence] = useState(false);
  const [isSavingSwapRequest, setIsSavingSwapRequest] = useState(false);
  const [isDeletingSchedule, setIsDeletingSchedule] = useState(false);
  const [removingAssignmentId, setRemovingAssignmentId] = useState<string | null>(null);
  const [isAssignmentModalVisible, setIsAssignmentModalVisible] = useState(false);
  const [isSwapModalVisible, setIsSwapModalVisible] = useState(false);

  const [details, setDetails] = useState<Awaited<
    ReturnType<typeof getScheduleDetails>
  >["data"]>(null);
  const [members, setMembers] = useState<MinistryMemberOption[]>([]);
  const [roles, setRoles] = useState<MinistryRoleOption[]>([]);
  const [assignments, setAssignments] = useState<ScheduleAssignmentDetailed[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [swapReason, setSwapReason] = useState("");
  const [selectedSwapAssignmentId, setSelectedSwapAssignmentId] = useState<string | null>(null);
  const [swapCandidates, setSwapCandidates] = useState<SwapCandidateOption[]>([]);
  const [pendingOwnSwapRequestId, setPendingOwnSwapRequestId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  const isAdmin = profile?.role === "admin";

  const loadScreen = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetchUserMinistries(true);

      const scheduleResult = await getScheduleDetails(route.params.scheduleId);
      if (scheduleResult.error || !scheduleResult.data) {
        throw new Error(scheduleResult.error ?? "Escala não encontrada.");
      }

      const [rolesResult, membersResult, assignmentsResult] = await Promise.all([
        getMinistryRolesOptions(scheduleResult.data.ministry_id),
        getMinistryMembersOptions(scheduleResult.data.ministry_id),
        getScheduleAssignmentsDetailed(scheduleResult.data.id),
      ]);

      if (rolesResult.error) throw new Error(rolesResult.error);
      if (membersResult.error) throw new Error(membersResult.error);
      if (assignmentsResult.error) throw new Error(assignmentsResult.error);

      setDetails(scheduleResult.data);
      setRoles(rolesResult.data ?? []);
      setMembers(membersResult.data ?? []);
      setAssignments(assignmentsResult.data ?? []);
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error.message ?? "Não foi possível carregar a escala.",
        [{ text: "Voltar", onPress: () => navigation.goBack() }],
      );
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserMinistries, navigation, route.params.scheduleId]);

  useEffect(() => {
    void loadScreen();
  }, [loadScreen]);

  const refreshHub = useCallback(async () => {
    if (!session?.user?.id) return;

    const leaderMinistryIds = isAdmin
      ? []
      : userMinistries
          .filter((ministry) => ministry.is_leader)
          .map((ministry) => ministry.id);

    await fetchScheduleCards({
      userId: session.user.id,
      isAdmin,
      leaderMinistryIds,
      forceRefresh: true,
    });
  }, [fetchScheduleCards, isAdmin, session?.user?.id, userMinistries]);

  const selectedMember = useMemo(
    () => members.find((member) => member.user_id === selectedMemberId) ?? null,
    [members, selectedMemberId],
  );
  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  );
  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return members;

    return members.filter((member) =>
      member.full_name.toLowerCase().includes(memberSearch.trim().toLowerCase()),
    );
  }, [memberSearch, members]);

  const pendingCount = assignments.filter((assignment) => assignment.status === "pending").length;
  const confirmedCount = assignments.filter((assignment) => assignment.status === "confirmed").length;
  const myAssignments = useMemo(
    () => getOwnAssignments(assignments, session?.user?.id),
    [assignments, session?.user?.id],
  );
  const hasMyAssignments = myAssignments.length > 0;
  const hasPendingOwnAssignments = hasConfirmableAssignments(myAssignments);
  const participationStatusLabel = getParticipationStatusLabel(myAssignments);
  const myRoleLabel = getOwnRoleLabel(myAssignments);
  const canManageSchedule = !!details && (
    isAdmin ||
    userMinistries.some(
      (ministry) => ministry.id === details.ministry_id && ministry.is_leader,
    )
  );
  const isOwnParticipationReadOnly = details
    ? isEventDateReadOnly(details.event.start_at)
    : false;
  const isManageReadOnly = details
    ? !isEventDateEditable(details.event.start_at)
    : false;
  const canManageScheduleActions = canManageSchedule && !isManageReadOnly;
  const ownParticipationHint = isOwnParticipationReadOnly
    ? "Escala encerrada. Nao e mais possivel confirmar ou solicitar troca."
    : pendingOwnSwapRequestId
      ? "Troca pendente para esta escala."
      : undefined;

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

  const handleAddAssignment = async () => {
    if (!canManageSchedule) {
      Alert.alert("Sem permissao", "Somente admin ou lider deste ministerio pode editar a equipe.");
      return;
    }

    if (isManageReadOnly) {
      Alert.alert(
        "Escala somente leitura",
        "Nao e mais possivel alterar a equipe no dia do evento ou depois dele.",
      );
      return;
    }

    if (!details || !selectedMemberId || !selectedRoleId) {
      Alert.alert("Campos obrigatórios", "Selecione membro e função para adicionar.");
      return;
    }

    if (selectedMember && !selectedMember.capability_role_ids.includes(selectedRoleId)) {
      Alert.alert("Capability obrigatória", "O usuário não possui capability para a função selecionada.");
      return;
    }

    const warningsResult = await getAssignmentWarningsForSchedule({
      scheduleId: details.id,
      userId: selectedMemberId,
    });

    if (warningsResult.error) {
      Alert.alert("Não foi possível validar warnings", warningsResult.error);
      return;
    }

    const warnings = warningsResult.data ?? [];

    const doInsert = async () => {
      setIsSavingAssignment(true);
      const { error } = await upsertScheduleAssignmentValidated({
        scheduleId: details.id,
        userId: selectedMemberId,
        roleId: selectedRoleId,
        status: "pending",
      });
      setIsSavingAssignment(false);

      if (error) {
        Alert.alert("Não foi possível adicionar na escala", error);
        return;
      }

      const assignmentsResult = await getScheduleAssignmentsDetailed(details.id);
      if (!assignmentsResult.error) {
        setAssignments(assignmentsResult.data ?? []);
      }

      await refreshHub();
      setSelectedMemberId(null);
      setSelectedRoleId(null);
      setMemberSearch("");
      setIsAssignmentModalVisible(false);
      Alert.alert("Sucesso", "Membro adicionado na escala.");
    };

    if (warnings.length > 0) {
      Alert.alert("Aviso", `${buildAssignmentWarningsMessage(warnings)}\n\nDeseja escalar mesmo assim?`, [
        { text: "Cancelar", style: "cancel" },
        { text: "Escalar mesmo assim", onPress: () => void doInsert() },
      ]);
      return;
    }

    await doInsert();
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!canManageSchedule) {
      Alert.alert("Sem permissao", "Somente admin ou lider deste ministerio pode editar a equipe.");
      return;
    }

    if (isManageReadOnly) {
      Alert.alert(
        "Escala somente leitura",
        "Nao e mais possivel alterar a equipe no dia do evento ou depois dele.",
      );
      return;
    }

    if (!details) return;

    Alert.alert("Remover da escala", "Deseja remover este membro da escala?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          setRemovingAssignmentId(assignmentId);
          const { error } = await removeScheduleAssignment(assignmentId);
          setRemovingAssignmentId(null);

          if (error) {
            Alert.alert("Não foi possível remover", error);
            return;
          }

          const assignmentsResult = await getScheduleAssignmentsDetailed(details.id);
          if (!assignmentsResult.error) {
            setAssignments(assignmentsResult.data ?? []);
          }

          await refreshHub();
        },
      },
    ]);
  };

  const handleDeleteSchedule = () => {
    if (!canManageSchedule) {
      Alert.alert("Sem permissao", "Somente admin ou lider deste ministerio pode excluir a escala.");
      return;
    }

    if (isManageReadOnly) {
      Alert.alert(
        "Escala somente leitura",
        "Nao e mais possivel excluir a escala no dia do evento ou depois dele.",
      );
      return;
    }

    if (!details) return;

    Alert.alert(
      "Excluir escala",
      "Deseja excluir esta escala? Essa acao remove tambem os membros ja adicionados.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            setIsDeletingSchedule(true);
            const { error } = await deleteSchedule(details.id);
            setIsDeletingSchedule(false);

            if (error) {
              Alert.alert("Nao foi possivel excluir a escala", error);
              return;
            }

            await refreshHub();
            Alert.alert("Escala excluida", "A escala foi removida com sucesso.", [
              {
                text: "OK",
                onPress: () => navigation.navigate("ScheduleScreen"),
              },
            ]);
          },
        },
      ],
    );
  };

  const handleConfirmOwnPresence = async () => {
    if (!details || !session?.user?.id) return;

    setIsConfirmingPresence(true);
    const { error } = await confirmMyAssignmentsForSchedule({
      scheduleId: details.id,
      userId: session.user.id,
    });
    setIsConfirmingPresence(false);

    if (error) {
      Alert.alert("Nao foi possivel confirmar presenca", error);
      return;
    }

    const assignmentsResult = await getScheduleAssignmentsDetailed(details.id);
    if (!assignmentsResult.error) {
      setAssignments(assignmentsResult.data ?? []);
    }

    await refreshHub();
  };

  const openSwapModal = () => {
    if (!hasMyAssignments) return;

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

      const nextAssignmentId = myAssignments[0]?.id ?? null;
      setSelectedSwapAssignmentId(nextAssignmentId);
      void loadSwapCandidates(nextAssignmentId);
      setSwapReason("");
      setIsSwapModalVisible(true);
    })();
  };

  const handleSubmitSwapRequest = async () => {
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
      setPendingOwnSwapRequestId(data?.id ?? null);
      setAssignments((current) =>
        current.map((assignment) =>
          assignment.id === selectedSwapAssignmentId
            ? { ...assignment, status: "pending" }
            : assignment,
        ),
      );
    };

  if (isLoading || !details) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
        <HeaderSecondary title="Escala" onBack={() => navigation.goBack()} />
        <View className="flex-1 items-center justify-center px-6">
          <Text style={{ color: "#6b7280" }}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <HeaderSecondary
        title="Escala"
        onBack={() => navigation.goBack()}
      />

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
                opacity: !canManageScheduleActions || isDeletingSchedule ? 0.6 : 1,
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
          {canManageSchedule && isManageReadOnly ? (
            <View
              style={{
                backgroundColor: "#fff7ed",
                borderRadius: 18,
                padding: 14,
                borderWidth: 1,
                borderColor: "#fdba74",
                marginBottom: 14,
              }}
            >
              <Text style={{ fontWeight: "700", color: "#9a3412", marginBottom: 4 }}>
                Escala somente leitura
              </Text>
              <Text style={{ color: "#9a3412" }}>
                No dia do evento e depois dele, a equipe fica bloqueada para alteracoes.
              </Text>
            </View>
          ) : null}

          {hasMyAssignments ? (
            <View
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: 18,
                padding: 14,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                marginBottom: 14,
              }}
            >
              <Text style={{ fontWeight: "700", fontSize: 15, marginBottom: 4 }}>
                Minha participacao
              </Text>
              <Text style={{ color: "#374151", marginBottom: 4 }}>
                Funcao: {myRoleLabel}
              </Text>
              <Text style={{ color: "#6b7280", marginBottom: 12 }}>
                Status: {participationStatusLabel}
              </Text>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <DefaultButton
                    variant={pendingOwnSwapRequestId ? "destructive" : "outline"}
                    disabled={isOwnParticipationReadOnly}
                    onPress={() => {
                      if (!pendingOwnSwapRequestId) {
                        openSwapModal();
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
                        const assignmentsResult = await getScheduleAssignmentsDetailed(details.id);
                        if (!assignmentsResult.error) {
                          setAssignments(assignmentsResult.data ?? []);
                        }
                        await refreshHub();
                      })();
                    }}
                  >
                    {pendingOwnSwapRequestId ? "Cancelar troca" : "Preciso trocar"}
                  </DefaultButton>
                </View>
                <View style={{ flex: 1 }}>
                  <DefaultButton
                    variant="primary"
                    onPress={handleConfirmOwnPresence}
                    isLoading={isConfirmingPresence}
                    disabled={isOwnParticipationReadOnly || !hasPendingOwnAssignments}
                  >
                    {hasPendingOwnAssignments ? "Confirmar presenca" : "Presenca confirmada"}
                  </DefaultButton>
                </View>
              </View>

              {ownParticipationHint ? (
                <Text style={{ color: "#6b7280", fontSize: 13, marginTop: 10 }}>
                  {ownParticipationHint}
                </Text>
              ) : null}
            </View>
          ) : null}

          {hasMyAssignments ? (
            <View
              style={{
                height: 1,
                backgroundColor: "#e5e7eb",
                marginBottom: 16,
              }}
            />
          ) : null}

          <Text style={{ fontWeight: "700", fontSize: 17, marginBottom: 12 }}>
            {canManageSchedule ? "Montagem da equipe" : "Equipe da escala"}
          </Text>

          {canManageSchedule ? (
            <>
              <TouchableOpacity
                onPress={() => {
                  if (!canManageScheduleActions) return;
                  setIsAssignmentModalVisible(true);
                }}
                disabled={!canManageScheduleActions}
                activeOpacity={0.85}
                style={{
                  backgroundColor: "#111827",
                  borderRadius: 20,
                  padding: 16,
                  marginBottom: 12,
                  opacity: canManageScheduleActions ? 1 : 0.6,
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "700",
                    fontSize: 16,
                    marginBottom: 4,
                    textAlign: "center",
                  }}
                >
                  Adicionar membro
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("ManageMinistryMembers", {
                    ministryId: details.ministry_id,
                  })
                }
                activeOpacity={0.85}
                style={{
                  backgroundColor: "#f1f5f9",
                  borderRadius: 18,
                  padding: 14,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: "#dbe3ec",
                }}
              >
                <Text style={{ fontWeight: "700", marginBottom: 4 }}>
                  Gerenciar membros do minist�rio
                </Text>
                <Text style={{ color: "#6b7280" }}>
                  Atualize capacidades e participa��o do minist�rio antes de montar
                  a equipe.
                </Text>
              </TouchableOpacity>
            </>
          ) : null}

          <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: "#fff7ed",
                borderRadius: 16,
                padding: 14,
              }}
            >
              <Text style={{ color: "#9a3412", fontSize: 12, marginBottom: 4 }}>
                Pendentes
              </Text>
              <Text
                style={{ fontSize: 20, fontWeight: "700", color: "#9a3412" }}
              >
                {pendingCount}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: "#ecfdf5",
                borderRadius: 16,
                padding: 14,
              }}
            >
              <Text style={{ color: "#166534", fontSize: 12, marginBottom: 4 }}>
                Confirmados
              </Text>
              <Text
                style={{ fontSize: 20, fontWeight: "700", color: "#166534" }}
              >
                {confirmedCount}
              </Text>
            </View>
          </View>

          <Text style={{ fontWeight: "700", fontSize: 15, marginBottom: 10 }}>
            Pessoas na escala
          </Text>
          {assignments.length === 0 ? (
            <View
              style={{
                backgroundColor: "#f9fafb",
                borderRadius: 18,
                padding: 16,
                borderWidth: 1,
                borderColor: "#eef2f7",
              }}
            >
              <Text style={{ fontWeight: "600", marginBottom: 4 }}>
                Nenhum membro escalado ainda
              </Text>
              {canManageSchedule ? (
                <>
                  <Text style={{ color: "#6b7280", marginBottom: 14 }}>
                    Use o fluxo de adi��o para come�ar a montar a equipe.
                  </Text>
                  <DefaultButton
                    onPress={() => setIsAssignmentModalVisible(true)}
                    disabled={!canManageScheduleActions}
                  >
                    Adicionar primeiro membro
                  </DefaultButton>
                </>
              ) : null}
            </View>
          ) : (
            assignments.map((assignment) => (
              <View
                key={assignment.id}
                style={{
                  borderWidth: 1,
                  borderColor: "#eef2f7",
                  borderRadius: 18,
                  padding: 14,
                  marginBottom: 10,
                  backgroundColor: "#fff",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "700", fontSize: 15 }}>
                    {assignment.member_name}
                  </Text>
                  <Text style={{ color: "#6b7280", marginTop: 2 }}>
                    {assignment.role_name}
                  </Text>
                  <Text
                    style={{ color: "#6b7280", marginTop: 2, fontSize: 12 }}
                  >
                    Status: {getAssignmentStatusLabel(assignment.status)}
                  </Text>
                </View>
                {canManageSchedule ? (
                  <TouchableOpacity
                    disabled={!canManageScheduleActions || removingAssignmentId === assignment.id}
                    onPress={() => handleRemoveAssignment(assignment.id)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: "#fff1f2",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity:
                        !canManageScheduleActions || removingAssignmentId === assignment.id
                          ? 0.5
                          : 1,
                    }}
                  >
                    <Trash2 size={18} color="#be123c" />
                  </TouchableOpacity>
                ) : null}
              </View>
            ))
          )}
        </View>

      </ScrollView>

      {canManageSchedule ? (
        <AssignmentPickerModal
          visible={isAssignmentModalVisible}
          eventTitle={details.event.title}
          ministryName={details.ministry.name}
          memberSearch={memberSearch}
          filteredMembers={filteredMembers}
          roles={roles}
          selectedMemberId={selectedMemberId}
          selectedRoleId={selectedRoleId}
          selectedMemberName={selectedMember?.full_name}
          selectedRoleName={selectedRole?.name}
          selectedMemberCapabilityRoleIds={
            selectedMember?.capability_role_ids ?? []
          }
          isSaving={isSavingAssignment}
          onClose={() => setIsAssignmentModalVisible(false)}
          onSearchChange={setMemberSearch}
          onSelectMember={setSelectedMemberId}
          onSelectRole={setSelectedRoleId}
          onSubmit={handleAddAssignment}
        />
      ) : null}

      <RequestSwapModal
        visible={isSwapModalVisible}
        title="Escolha qual funcao desta escala voce precisa trocar."
        assignments={myAssignments}
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
        onSubmit={handleSubmitSwapRequest}
      />
    </SafeAreaView>
  );
}


