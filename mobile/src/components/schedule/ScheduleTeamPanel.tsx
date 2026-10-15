import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useRef, useState } from "react";
import { Alert, TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";
import AssignmentPickerModal from "./AssignmentPickerModal";
import MyScheduleParticipationCard from "./MyScheduleParticipationCard";
import ScheduleAssignmentList from "./ScheduleAssignmentList";
import {
  removeScheduleAssignment,
  type ScheduleAssignmentDetailed,
  type ScheduleDetails,
} from "../../services/scheduleService";
import { useAuthStore } from "../../stores/useAuthStore";
import type { RootStackParamList } from "../../types/navigation";
import { isEventDateEditable } from "../../utils/scheduleRules";

interface Props {
  details: ScheduleDetails;
  assignments: ScheduleAssignmentDetailed[];
  canManage: () => boolean;
  onChanged: () => Promise<void>;
}

export default function ScheduleTeamPanel({
  details,
  assignments,
  canManage,
  onChanged,
}: Props) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session, sessionRevision } = useAuthStore();
  const [isAssignmentModalVisible, setIsAssignmentModalVisible] =
    useState(false);
  const [removingAssignmentId, setRemovingAssignmentId] = useState<
    string | null
  >(null);
  const visitRevision = useRef(0);
  const focused = useRef(false);
  const canManageSchedule = canManage();
  const isManageReadOnly = !isEventDateEditable(details.event.start_at);
  const canManageScheduleActions = canManageSchedule && !isManageReadOnly;
  const hasMyAssignments = assignments.some(
    (assignment) => assignment.user_id === session?.user.id,
  );
  const pendingCount = assignments.filter(
    (assignment) => assignment.status === "pending",
  ).length;
  const confirmedCount = assignments.filter(
    (assignment) => assignment.status === "confirmed",
  ).length;
  const captureVisit = () => {
    const visit = visitRevision.current;
    return () =>
      focused.current &&
      visit === visitRevision.current &&
      sessionRevision === useAuthStore.getState().sessionRevision;
  };
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      setRemovingAssignmentId(null);
      return () => {
        focused.current = false;
        ++visitRevision.current;
      };
    }, [details.id, sessionRevision]),
  );
  const discardObsoleteWrite = async (
    current: () => boolean,
    error: string | null,
  ) => {
    if (current()) return false;
    if (!error && sessionRevision === useAuthStore.getState().sessionRevision)
      await onChanged();
    return true;
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!canManage()) {
      Alert.alert(
        "Sem permissao",
        "Somente admin ou lider deste ministerio pode editar a equipe.",
      );
      return;
    }

    if (details && !isEventDateEditable(details.event.start_at)) {
      Alert.alert(
        "Escala somente leitura",
        "Nao e mais possivel alterar a equipe no horario do evento ou depois dele.",
      );
      return;
    }

    if (!details) return;

    const current = captureVisit();
    Alert.alert("Remover da escala", "Deseja remover este membro da escala?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          if (!canManage()) return;
          if (!current()) return;
          if (!isEventDateEditable(details.event.start_at)) {
            Alert.alert("Escala somente leitura", "O evento já começou.");
            return;
          }
          setRemovingAssignmentId(assignmentId);
          const { error } = await removeScheduleAssignment(assignmentId);
          if (await discardObsoleteWrite(current, error)) return;
          setRemovingAssignmentId(null);

          if (error) {
            Alert.alert(
              "Nao foi possivel remover",
              "O membro nao foi removido da escala. Tente novamente em alguns instantes.",
            );
            return;
          }

          await onChanged();
        },
      },
    ]);
  };

  return (
    <>
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
            <Text
              style={{ fontWeight: "700", color: "#9a3412", marginBottom: 4 }}
            >
              Escala somente leitura
            </Text>
            <Text style={{ color: "#9a3412" }}>
              No horario do evento e depois dele, a equipe fica bloqueada para
              alteracoes.
            </Text>
          </View>
        ) : null}

        {hasMyAssignments ? (
          <MyScheduleParticipationCard
            details={details}
            assignments={assignments}
            onChanged={onChanged}
          />
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
                Gerenciar membros do ministério
              </Text>
              <Text style={{ color: "#6b7280" }}>
                Atualize capacidades e participação do ministério antes de
                montar a equipe.
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
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#9a3412" }}>
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
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#166534" }}>
              {confirmedCount}
            </Text>
          </View>
        </View>

        <ScheduleAssignmentList
          assignments={assignments}
          canManageSchedule={canManageSchedule}
          canManageScheduleActions={canManageScheduleActions}
          removingAssignmentId={removingAssignmentId}
          onAddFirstMember={() => setIsAssignmentModalVisible(true)}
          handleRemoveAssignment={handleRemoveAssignment}
        />
      </View>

      {canManageSchedule ? (
        <AssignmentPickerModal
          visible={isAssignmentModalVisible}
          details={details}
          canManage={canManage}
          assignedMemberIds={assignments.map(
            (assignment) => assignment.user_id,
          )}
          onClose={() => setIsAssignmentModalVisible(false)}
          onChanged={onChanged}
        />
      ) : null}
    </>
  );
}
