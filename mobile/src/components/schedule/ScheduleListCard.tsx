import { ChevronRight } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";
import { formatDateShort, formatDateTime, formatTime } from "../../utils/formatDate";
import { Text } from "../ui/text";

interface ScheduleListCardProps {
  eventTitle: string;
  startAt: string;
  ministryName: string;
  participationLabel: string;
  roleLabel: string;
  eventLocation?: string | null;
  featured?: boolean;
  onPress: () => void;
}

export default function ScheduleListCard({
  eventTitle,
  startAt,
  ministryName,
  participationLabel,
  roleLabel,
  eventLocation,
  featured = false,
  onPress,
}: ScheduleListCardProps) {
  const roleDescription = roleLabel.trim() ? roleLabel : "Consultar equipe";
  const participationTone = participationLabel === "Pendente"
    ? "bg-amber-100 text-amber-900"
    : participationLabel === "Confirmado"
      ? "bg-emerald-100 text-emerald-900"
      : participationLabel === "Recusado"
        ? "bg-red-100 text-red-900"
        : "bg-slate-100 text-slate-700";
  const secondaryText = featured ? "text-[#c0d0c2]" : "text-[#647565]";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Abrir escala ${eventTitle}, ${ministryName}, ${formatDateTime(startAt)}, ${participationLabel}, ${roleDescription}${eventLocation ? `, Local: ${eventLocation}` : ""}`}
      className={`mb-3 rounded-[18px] border p-[17px] ${featured ? "border-[#244735] bg-[#244735]" : "border-[#e1e8df] bg-white"}`}
    >
      <View className="mb-4 flex-row flex-wrap items-start justify-between gap-3">
        <View className="min-w-0 shrink">
          <Text className={`text-xs font-semibold uppercase tracking-wide ${featured ? "text-[#b7c9bc]" : "text-[#647565]"}`}>
            {formatDateShort(startAt)} · {new Date(startAt).getFullYear()}
          </Text>
          <Text className={`mt-1 font-semibold ${featured ? "text-[34px] leading-[40px] text-white" : "text-[32px] leading-[38px] text-[#223b2a]"}`}>
            {formatTime(startAt)}
          </Text>
        </View>
        <Text className={`max-w-full rounded-lg px-2 py-1 text-xs font-semibold ${participationTone}`}>
          {participationLabel}
        </Text>
      </View>
      <Text accessibilityRole="header" className={`text-lg font-bold ${featured ? "text-white" : "text-[#223b2a]"}`}>
        {ministryName}
      </Text>
      <Text className={`mt-1 text-sm ${secondaryText}`}>{eventTitle}</Text>
      <View className={`mt-4 flex-row items-center gap-3 border-t pt-3 ${featured ? "border-[#43614c]" : "border-[#edf0e9]"}`}>
        <View className="min-w-0 flex-1">
          <Text className={`text-sm ${secondaryText}`}>{roleDescription}</Text>
          {eventLocation ? <Text className={`mt-1 text-sm ${secondaryText}`}>Local: {eventLocation}</Text> : null}
        </View>
        <ChevronRight size={18} color={featured ? "#c0d0c2" : "#647565"} />
      </View>
    </TouchableOpacity>
  );
}
