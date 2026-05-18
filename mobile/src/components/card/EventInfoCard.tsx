import { Calendar, Clock, MapPin } from "lucide-react-native";
import { View } from "react-native";
import { Divider, Text } from "react-native-paper";
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
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        padding: 20,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: "row", gap: 14, alignItems: "flex-start" }}>
        <View
          style={{
            width: 64,
            minHeight: 72,
            borderRadius: 22,
            backgroundColor: "#111827",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>
            {date.weekday}
          </Text>
          <Text style={{ color: "#fff", fontSize: 26, fontWeight: "900", lineHeight: 30 }}>
            {date.day}
          </Text>
          <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>
            {date.month}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <View
            style={{
              alignSelf: "flex-start",
              backgroundColor: "#f3f4f6",
              borderRadius: 999,
              paddingHorizontal: 10,
              paddingVertical: 5,
              marginBottom: 8,
            }}
          >
            <Text style={{ color: "#111827", fontSize: 12, fontWeight: "800" }}>
              {categoryOption.label}
            </Text>
          </View>

          <Text style={{ fontWeight: "900", fontSize: 22, color: "#111827" }}>
            {title}
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 18, gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Calendar size={18} color="#6b7280" style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 15, color: "#374151" }}>
            {date.weekday}, {date.day} {date.month} {date.year}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Clock size={18} color="#6b7280" style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 15, color: "#374151" }}>{timeRange}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <MapPin size={18} color="#6b7280" style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 15, color: "#374151" }}>{location}</Text>
        </View>
      </View>

      <Divider style={{ marginVertical: 16, backgroundColor: "#e5e7eb" }} />
      <Text style={{ color: "#6b7280", fontSize: 13, marginBottom: 6, fontWeight: "700" }}>
        Descrição
      </Text>
      <Text style={{ fontSize: 15, color: "#374151", lineHeight: 22 }}>{description}</Text>
    </View>
  );
}
