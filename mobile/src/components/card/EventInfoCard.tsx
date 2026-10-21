import { colors } from "../../theme/colors";
import { Separator } from "../ui/separator";
import { Text } from "../ui/text";
import { Card } from "../ui/card";
import { Calendar, Clock, MapPin } from "lucide-react-native";
import { View } from "react-native";

import { getEventCategoryOption } from "../../utils/eventCategory";

interface EventInfoCardProps {
  title: string;
  category?: string | null;
  startAt: string;
  endAt?: string | null;
  location: string;
  description: string;
}

function buildDateParts(startAt: string) {
  const date = new Date(startAt);
  const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const months = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  return {
    weekday: weekdays[date.getDay()],
    day: String(date.getDate()).padStart(2, "0"),
    month: months[date.getMonth()],
    year: String(date.getFullYear()),
  };
}

function formatTimeRange(startAt: string, endAt?: string | null) {
  const start = new Date(startAt);
  const end = endAt ? new Date(endAt) : null;

  const startLabel = start.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (!end || Number.isNaN(end.getTime())) return startLabel;

  return `${startLabel} - ${end.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export default function EventInfoCard({
  title,
  category,
  startAt,
  endAt,
  location,
  description,
}: EventInfoCardProps) {
  const categoryOption = getEventCategoryOption(category);
  const date = buildDateParts(startAt);
  const timeRange = formatTimeRange(startAt, endAt);

  return (
    <Card className="mb-6 rounded-[20px] p-5">
      <View style={{ flexDirection: "row", gap: 14, alignItems: "flex-start" }}>
        <View
          style={{
            width: 64,
            minHeight: 72,
            borderRadius: 22,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: colors.primaryForeground, fontSize: 11, fontWeight: "700" }}>
            {date.weekday}
          </Text>
          <Text style={{ color: colors.primaryForeground, fontSize: 26, fontWeight: "900", lineHeight: 30 }}>
            {date.day}
          </Text>
          <Text style={{ color: colors.primaryForeground, fontSize: 11, fontWeight: "700" }}>
            {date.month}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <View
            style={{
              alignSelf: "flex-start",
              backgroundColor: colors.muted,
              borderRadius: 999,
              paddingHorizontal: 10,
              paddingVertical: 5,
              marginBottom: 8,
            }}
          >
            <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "800" }}>
              {categoryOption.label}
            </Text>
          </View>

          <Text style={{ fontWeight: "900", fontSize: 22, color: colors.foreground }}>
            {title}
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 18, gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Calendar size={18} color={colors.mutedForeground} style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 15, color: colors.mutedForeground }}>
            {date.weekday}, {date.day} {date.month} {date.year}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Clock size={18} color={colors.mutedForeground} style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 15, color: colors.mutedForeground }}>{timeRange}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <MapPin size={18} color={colors.mutedForeground} style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 15, color: colors.mutedForeground }}>{location}</Text>
        </View>
      </View>

      <Separator style={{ marginVertical: 16, backgroundColor: colors.border }} />
      <Text style={{ color: colors.mutedForeground, fontSize: 13, marginBottom: 6, fontWeight: "700" }}>
        Descrição
      </Text>
      <Text style={{ fontSize: 15, color: colors.mutedForeground, lineHeight: 22 }}>{description}</Text>
    </Card>
  );
}
