import { Clock, MapPin } from "lucide-react-native";
import { View } from "react-native";
import { Card, Text } from "react-native-paper";
import { getEventCategoryOption } from "../../utils/eventCategory";
import DefaultButton from "../button/DefaultButton";

interface EventCardProps {
  title: string;
  date: string;
  category?: string | null;
  startAt?: string;
  endAt?: string | null;
  location?: string;
  role?: string;
  department?: string;
  description?: string;
  onConfirm?: () => void;
  onSwap?: () => void;
  onDetails?: () => void;
  showActions?: boolean;
  swapLabel?: string;
  swapVariant?: "outline" | "destructive";
  confirmLabel?: string;
  confirmDisabled?: boolean;
  swapDisabled?: boolean;
  actionHint?: string;
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
  const isInformationalEvent = Boolean(props.category || props.startAt) && !props.showActions;

  if (isInformationalEvent) {
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

              <Text style={{ color: "#111827", fontWeight: "700", fontSize: 14 }}>
                {props.date}
              </Text>

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
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card
      style={{
        marginBottom: 16,
        borderRadius: 20,
        paddingVertical: 8,
        backgroundColor: "#fff",
      }}
      onPress={props.onDetails}
    >
      <Card.Content style={{ paddingVertical: 18 }}>
        <Text style={{ fontWeight: "bold", fontSize: 20, marginBottom: 6 }}>
          {props.title}
        </Text>
        <Text
          style={{
            color: "#000",
            fontWeight: "bold",
            fontSize: 16,
            marginBottom: 6,
          }}
        >
          {props.date}
        </Text>
        {props.location && (
          <View className="flex-row items-center mt-2 mb-3">
            <MapPin size={18} color="#888" style={{ marginRight: 4 }} />
            <Text style={{ color: "#888", fontSize: 15 }}>{props.location}</Text>
          </View>
        )}

        {props.description && (
          <Text
            numberOfLines={2}
            style={{ color: "#444", fontSize: 14, marginBottom: 12, lineHeight: 20 }}
          >
            {props.description}
          </Text>
        )}

        {(props.department || props.role) && (
          <View className="flex-row gap-8 mt-1">
            {props.department && (
              <View className="flex-1">
                <Text style={{ color: "#888", fontSize: 13, marginBottom: 2 }}>
                  Departamento
                </Text>
                <Text style={{ fontSize: 16, fontWeight: "bold" }}>{props.department}</Text>
              </View>
            )}
            {props.role && (
              <View className="flex-1">
                <Text style={{ color: "#888", fontSize: 13, marginBottom: 2 }}>
                  Função
                </Text>
                <Text style={{ fontSize: 16, fontWeight: "bold" }}>{props.role}</Text>
              </View>
            )}
          </View>
        )}
      </Card.Content>

      {props.showActions && (
        <View className="px-4 pb-4">
          {props.actionHint ? (
            <Text style={{ color: "#6b7280", fontSize: 13, marginBottom: 10 }}>
              {props.actionHint}
            </Text>
          ) : null}

          <View className="flex-row gap-3">
            <View className="flex-1">
              <DefaultButton
                variant={props.swapVariant ?? "outline"}
                onPress={props.onSwap}
                disabled={props.swapDisabled}
              >
                {props.swapLabel ?? "Preciso trocar"}
              </DefaultButton>
            </View>

            <View className="flex-1">
              <DefaultButton
                variant="primary"
                onPress={props.onConfirm}
                disabled={props.confirmDisabled}
              >
                {props.confirmLabel ?? "Confirmar"}
              </DefaultButton>
            </View>
          </View>
        </View>
      )}
    </Card>
  );
}
