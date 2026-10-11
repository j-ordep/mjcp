import { ChevronRight, Clock, MapPin } from "lucide-react-native";
import { View } from "react-native";
import { Card, Text } from "react-native-paper";
import { getEventCategoryOption } from "../../utils/eventCategory";

interface EventCardProps {
  title: string;
  date: string;
  category?: string | null;
  startAt?: string;
  endAt?: string | null;
  location?: string;
  description?: string;
  onDetails?: () => void;
}

function buildDatePlate(startAt?: string) {
  if (!startAt) return null;

  const date = new Date(startAt);
  if (Number.isNaN(date.getTime())) return null;

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
  };
}

function formatTimeRange(startAt?: string, endAt?: string | null) {
  if (!startAt) return null;

  const start = new Date(startAt);
  const end = endAt ? new Date(endAt) : null;

  if (Number.isNaN(start.getTime())) return null;

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

export default function EventCard(props: EventCardProps) {
  const category = getEventCategoryOption(props.category);
  const datePlate = buildDatePlate(props.startAt);
  const timeRange = formatTimeRange(props.startAt, props.endAt);
  const showDateLine = !datePlate && Boolean(props.date);

  return (
    <Card
      style={{
        marginBottom: 16,
        borderRadius: 24,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
      }}
      onPress={props.onDetails}
    >
      <Card.Content style={{ paddingVertical: 18, paddingHorizontal: 18 }}>
        <View style={{ flexDirection: "row", gap: 14, alignItems: "flex-start" }}>
          {datePlate ? (
            <View
              style={{
                width: 58,
                minHeight: 64,
                borderRadius: 20,
                backgroundColor: "#111827",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 8,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>
                {datePlate.weekday}
              </Text>
              <Text style={{ color: "#fff", fontSize: 24, fontWeight: "900", lineHeight: 28 }}>
                {datePlate.day}
              </Text>
              <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>
                {datePlate.month}
              </Text>
            </View>
          ) : null}

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
                {category.label}
              </Text>
            </View>

            <Text style={{ fontWeight: "900", fontSize: 20, marginBottom: 6, color: "#1f2937" }}>
              {props.title}
            </Text>

            {showDateLine ? (
              <Text style={{ color: "#111827", fontWeight: "700", fontSize: 14 }}>
                {props.date}
              </Text>
            ) : null}

            {timeRange ? (
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
                <Clock size={16} color="#6b7280" style={{ marginRight: 6 }} />
                <Text style={{ color: "#4b5563", fontSize: 14 }}>{timeRange}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {props.location ? (
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 14 }}>
            <MapPin size={17} color="#6b7280" style={{ marginRight: 6 }} />
            <Text style={{ color: "#4b5563", fontSize: 14 }}>{props.location}</Text>
          </View>
        ) : null}

        {props.description ? (
          <Text
            numberOfLines={2}
            style={{
              color: "#4b5563",
              fontSize: 14,
              marginTop: 12,
              lineHeight: 20,
            }}
          >
            {props.description}
          </Text>
        ) : null}

        {props.onDetails ? (
          <View
            style={{
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "flex-end",
              marginTop: 14,
            }}
          >
            <Text style={{ color: "#6b7280", fontSize: 13, fontWeight: "700" }}>
              Ver detalhes
            </Text>
            <ChevronRight size={16} color="#6b7280" style={{ marginLeft: 2 }} />
          </View>
        ) : null}
      </Card.Content>
    </Card>
  );
}
