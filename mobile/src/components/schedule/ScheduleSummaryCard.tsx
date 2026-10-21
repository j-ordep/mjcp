import { colors } from "../../theme/colors";
import { Text } from "../ui/text";
import { Card } from "../ui/card";


interface ScheduleSummaryCardProps {
  eventTitle?: string | null;
  eventDate?: string | null;
  eventLocation?: string | null;
  ministryName?: string | null;
  participationLabel?: string;
  roleLabel?: string;
}

export default function ScheduleSummaryCard({
  eventTitle,
  eventDate,
  eventLocation,
  ministryName,
  participationLabel,
  roleLabel,
}: ScheduleSummaryCardProps) {
  return (
    <Card className="mb-[18px] rounded-[18px] p-3.5">
      <Text style={{ fontWeight: "700", marginBottom: 10 }}>Resumo rapido</Text>
      {eventTitle ? (
        <Text style={{ color: colors.mutedForeground, marginBottom: 4 }}>Evento: {eventTitle}</Text>
      ) : null}
      {eventDate ? (
        <Text style={{ color: colors.mutedForeground, marginBottom: 4 }}>Data: {eventDate}</Text>
      ) : null}
      {eventLocation ? (
        <Text style={{ color: colors.mutedForeground, marginBottom: 4 }}>Local: {eventLocation}</Text>
      ) : null}
      {ministryName ? (
        <Text style={{ color: colors.mutedForeground }}>
          Ministerio: {ministryName}
        </Text>
      ) : null}
      {roleLabel ? <Text style={{ color: colors.mutedForeground, marginTop: 6 }}>Função: {roleLabel}</Text> : null}
      {participationLabel ? <Text style={{ color: colors.mutedForeground, marginTop: 6 }}>Participação: {participationLabel}</Text> : null}
    </Card>
  );
}
