import { colors } from "../../theme/colors";
import { Text } from "../ui/text";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, View } from "react-native";

import DefaultButton from "../button/DefaultButton";
import RequestSwapModal from "./RequestSwapModal";
import {
  cancelOwnSwapRequest,
  confirmMyAssignmentsForSchedule,
  createSwapRequest,
  getOwnPendingSwapRequestForAssignments,
  getSwapCandidatesForAssignment,
  type ScheduleAssignmentDetailed,
  type ScheduleDetails,
  type SwapCandidateOption,
} from "../../services/scheduleService";
import { useAuthStore } from "../../stores/useAuthStore";
import {
  getOwnAssignments,
  getOwnRoleLabel,
  getParticipationStatusLabel,
  hasConfirmableAssignments,
} from "../../utils/scheduleParticipation";
import {
  isEventDateEditable,
  isEventDateReadOnly,
} from "../../utils/scheduleRules";

interface Props {
  details: ScheduleDetails;
  assignments: ScheduleAssignmentDetailed[];
  onChanged: () => Promise<void>;
}

export default function MyScheduleParticipationCard({
  details,
  assignments,
  onChanged,
}: Props) {
  const { session, sessionRevision } = useAuthStore();
  const [isConfirmingPresence, setIsConfirmingPresence] = useState(false);
  const [isSavingSwapRequest, setIsSavingSwapRequest] = useState(false);
  const [isSwapModalVisible, setIsSwapModalVisible] = useState(false);
  const [swapReason, setSwapReason] = useState("");
  const [selectedSwapAssignmentId, setSelectedSwapAssignmentId] = useState<
    string | null
  >(null);
  const [swapCandidates, setSwapCandidates] = useState<SwapCandidateOption[]>(
    [],
  );
  const [pendingOwnSwapRequestId, setPendingOwnSwapRequestId] = useState<
    string | null
  >(null);
  const loadRevision = useRef(0);
  const candidateRevision = useRef(0);
  const focused = useRef(false);
  const myAssignments = useMemo(
    () => getOwnAssignments(assignments, session?.user.id),
    [assignments, session?.user.id],
  );
  const hasMyAssignments = myAssignments.length > 0;
  const hasPendingOwnAssignments = hasConfirmableAssignments(myAssignments);
  const participationStatusLabel = getParticipationStatusLabel(myAssignments);
  const myRoleLabel = getOwnRoleLabel(myAssignments);
  const isOwnParticipationReadOnly = isEventDateReadOnly(
    details.event.start_at,
  );
  const ownParticipationHint = isOwnParticipationReadOnly
    ? "Escala encerrada. Nao e mais possivel confirmar, solicitar troca ou cancelar troca no horario do evento ou depois dele."
    : pendingOwnSwapRequestId
      ? "Troca pendente para esta escala."
      : undefined;
  const isSameSession = () =>
    sessionRevision === useAuthStore.getState().sessionRevision;
  const captureVisit = () => {
    const visit = loadRevision.current;
    return () =>
      focused.current && visit === loadRevision.current && isSameSession();
  };

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      return () => {
        focused.current = false;
        ++loadRevision.current;
        ++candidateRevision.current;
      };
    }, [details.id, sessionRevision]),
  );

  // Confirmed writes still refresh the parent if this component was replaced during a new visit.
  const discardObsoleteWrite = async (
    current: () => boolean,
    error: string | null,
  ) => {
    if (current()) return false;
    if (!error && isSameSession()) await onChanged();
    return true;
  };

  useEffect(() => {
    let active = true;
    const visit = loadRevision.current;
    const authRevision = useAuthStore.getState().sessionRevision;
    const loadPendingOwnSwapRequest = async () => {
      const { data, error } = await getOwnPendingSwapRequestForAssignments(
        myAssignments.map((assignment) => assignment.id),
      );

      if (
        !active ||
        visit !== loadRevision.current ||
        authRevision !== useAuthStore.getState().sessionRevision
      )
        return;
      if (error) {
        setPendingOwnSwapRequestId(null);
        return;
      }

      setPendingOwnSwapRequestId(data?.id ?? null);
    };

    void loadPendingOwnSwapRequest();
    return () => {
      active = false;
    };
  }, [myAssignments]);

  const loadSwapCandidates = useCallback(
    async (assignmentId: string | null) => {
      const request = ++candidateRevision.current;
      const authRevision = useAuthStore.getState().sessionRevision;
      if (!assignmentId) {
        setSwapCandidates([]);
        return;
      }

      const { data, error } =
        await getSwapCandidatesForAssignment(assignmentId);
      if (
        request !== candidateRevision.current ||
        authRevision !== useAuthStore.getState().sessionRevision
      )
        return;
      if (error) {
        Alert.alert(
          "Nao foi possivel carregar candidatos",
          "Tente novamente em alguns instantes.",
        );
        setSwapCandidates([]);
        return;
      }

      setSwapCandidates(data ?? []);
    },
    [],
  );

  const handleConfirmOwnPresence = async () => {
    if (
      !details ||
      !session?.user?.id ||
      !isEventDateEditable(details.event.start_at)
    )
      return;
    const current = captureVisit();
    if (!current()) return;
    setIsConfirmingPresence(true);
    const { error } = await confirmMyAssignmentsForSchedule({
      scheduleId: details.id,
      userId: session.user.id,
    });
    if (await discardObsoleteWrite(current, error)) return;
    setIsConfirmingPresence(false);

    if (error) {
      Alert.alert(
        "Nao foi possivel confirmar presenca",
        "Sua presenca nao foi confirmada. Tente novamente em alguns instantes.",
      );
      return;
    }

    await onChanged();
  };

  const openSwapModal = async () => {
    if (
      !hasMyAssignments ||
      !details ||
      !isEventDateEditable(details.event.start_at)
    )
      return;
    const current = captureVisit();
    if (!current()) return;

    const { data: pendingRequest, error } =
      await getOwnPendingSwapRequestForAssignments(
        myAssignments.map((assignment) => assignment.id),
      );

    if (!current()) return;
    if (error) {
      Alert.alert(
        "Nao foi possivel verificar a troca",
        "Tente novamente em alguns instantes.",
      );
      return;
    }

    if (!current()) return;
    if (pendingRequest) {
      setPendingOwnSwapRequestId(pendingRequest.id);
      return;
    }

    const nextAssignmentId = myAssignments[0]?.id ?? null;
    setSelectedSwapAssignmentId(nextAssignmentId);
    void loadSwapCandidates(nextAssignmentId);
    setSwapReason("");
    setIsSwapModalVisible(true);
  };

  const handleSubmitSwapRequest = async () => {
    if (
      !selectedSwapAssignmentId ||
      !details ||
      !isEventDateEditable(details.event.start_at)
    )
      return;
    const current = captureVisit();
    if (!current()) return;

    setIsSavingSwapRequest(true);
    const { data, error } = await createSwapRequest({
      fromAssignmentId: selectedSwapAssignmentId,
      reason: swapReason,
    });
    if (await discardObsoleteWrite(current, error)) return;
    setIsSavingSwapRequest(false);

    if (error) {
      Alert.alert(
        "Nao foi possivel solicitar troca",
        "Sua solicitacao de troca nao foi enviada. Tente novamente em alguns instantes.",
      );
      return;
    }

    setIsSwapModalVisible(false);
    setSelectedSwapAssignmentId(null);
    setSwapReason("");
    setPendingOwnSwapRequestId(data?.id ?? null);
    await onChanged();
  };

  const handleOwnSwapPress = async () => {
    if (!details || !isEventDateEditable(details.event.start_at)) return;
    const current = captureVisit();
    if (!current()) return;
    if (!pendingOwnSwapRequestId) {
      void openSwapModal();
      return;
    }

    const { error } = await cancelOwnSwapRequest(pendingOwnSwapRequestId);
    if (await discardObsoleteWrite(current, error)) return;
    if (error) {
      Alert.alert(
        "Nao foi possivel cancelar",
        "A solicitacao de troca nao foi cancelada. Tente novamente em alguns instantes.",
      );
      return;
    }

    setPendingOwnSwapRequestId(null);
    await onChanged();
  };

  if (!hasMyAssignments) return null;
  return (
    <>
      <View
        style={{
          backgroundColor: colors.muted,
          borderRadius: 18,
          padding: 14,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 14,
        }}
      >
        <Text style={{ fontWeight: "700", fontSize: 15, marginBottom: 4 }}>
          Minha participacao
        </Text>
        <Text style={{ color: colors.mutedForeground, marginBottom: 4 }}>
          Funcao: {myRoleLabel}
        </Text>
        <Text style={{ color: colors.mutedForeground, marginBottom: 12 }}>
          Status: {participationStatusLabel}
        </Text>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <DefaultButton
              variant={pendingOwnSwapRequestId ? "destructive" : "outline"}
              disabled={isOwnParticipationReadOnly}
              onPress={handleOwnSwapPress}
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
              {hasPendingOwnAssignments ? "Confirmar" : "Confirmado"}
            </DefaultButton>
          </View>
        </View>

        {ownParticipationHint ? (
          <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 10 }}>
            {ownParticipationHint}
          </Text>
        ) : null}
      </View>
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
    </>
  );
}
