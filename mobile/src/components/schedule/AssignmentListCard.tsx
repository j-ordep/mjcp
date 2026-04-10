import { CheckCircle2, CircleAlert } from "lucide-react-native";
import { View } from "react-native";
import { Text } from "react-native-paper";
import type { ScheduleAssignmentDetailed } from "../../services/scheduleService";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getStatusMeta(status: ScheduleAssignmentDetailed["status"]) {
  switch (status) {
    case "confirmed":
      return { label: "Confirmado", bg: "#eafcf3", color: "#15803d" };
    case "declined":
      return { label: "Recusado", bg: "#fee2e2", color: "#991b1b" };
    case "swapped":
      return { label: "Trocado", bg: "#ede9fe", color: "#6d28d9" };
    default:
      return { label: "Pendente", bg: "#f3f4f6", color: "#4b5563" };
  }
}

interface AssignmentListCardProps {
  assignment: ScheduleAssignmentDetailed;
}

export default function AssignmentListCard({ assignment }: AssignmentListCardProps) {
  const status = getStatusMeta(assignment.status);
  const StatusIcon = assignment.status === "confirmed" ? CheckCircle2 : CircleAlert;

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: "#eef2f7",
        borderRadius: 18,
        padding: 14,
        marginBottom: 10,
        backgroundColor: "#fff",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: "#111827",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>{getInitials(assignment.member_name)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "700", fontSize: 15 }}>{assignment.member_name}</Text>
          <Text style={{ color: "#6b7280", marginTop: 2 }}>{assignment.role_name}</Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: status.bg,
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 6,
          }}
        >
          <StatusIcon size={14} color={status.color} />
          <Text style={{ marginLeft: 6, color: status.color, fontWeight: "600" }}>
            {status.label}
          </Text>
        </View>
      </View>
    </View>
  );
}
