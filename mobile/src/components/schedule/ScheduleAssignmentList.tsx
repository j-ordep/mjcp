import { TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";
import { Trash2 } from "lucide-react-native";
import DefaultButton from "../button/DefaultButton";
import type { ScheduleAssignmentDetailed } from "../../types/scheduling";
import { getAssignmentStatusLabel } from "../../utils/statusLabels";

interface Props {
  assignments: ScheduleAssignmentDetailed[];
  canManageSchedule: boolean;
  canManageScheduleActions: boolean;
  removingAssignmentId: string | null;
  onAddFirstMember: () => void;
  handleRemoveAssignment: (assignmentId: string) => Promise<void>;
}

export default function ScheduleAssignmentList({
  assignments, canManageSchedule, canManageScheduleActions,
  removingAssignmentId, onAddFirstMember, handleRemoveAssignment,
}: Props) {
  return (
    <>
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
                Use o fluxo de adição para começar a montar a equipe.
              </Text>
              <DefaultButton
                onPress={onAddFirstMember}
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
    </>
  );
}
