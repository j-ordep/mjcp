import { View } from "react-native";
import { Text } from "react-native-paper";

interface ScheduleSummaryCardProps {
  eventTitle?: string | null;
  eventDate?: string | null;
  ministryName?: string | null;
  notes?: string | null;
}

export default function ScheduleSummaryCard({
  eventTitle,
  eventDate,
  ministryName,
  notes,
}: ScheduleSummaryCardProps) {
  return (
    <View
      style={{
        backgroundColor: "#f9fafb",
        borderRadius: 18,
        padding: 14,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: "#eef2f7",
      }}
    >
      <Text style={{ fontWeight: "700", marginBottom: 10 }}>Resumo rapido</Text>
      {eventTitle ? (
        <Text style={{ color: "#374151", marginBottom: 4 }}>Evento: {eventTitle}</Text>
      ) : null}
      {eventDate ? (
        <Text style={{ color: "#6b7280", marginBottom: 4 }}>Data: {eventDate}</Text>
      ) : null}
      {ministryName ? (
        <Text style={{ color: "#374151", marginBottom: notes ? 4 : 0 }}>
          Ministerio: {ministryName}
        </Text>
      ) : null}
      {notes ? <Text style={{ color: "#6b7280" }}>Observacoes: {notes}</Text> : null}
    </View>
  );
}
