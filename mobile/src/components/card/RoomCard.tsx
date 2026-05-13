import { Clock } from "lucide-react-native";
import { View } from "react-native";
import { Text } from "react-native-paper";
import type {
  RoomAvailability,
  RoomDailyAgendaItem,
} from "../../services/roomReservationService";
import { buildRoomAgendaDisplayItems } from "../../utils/roomAgenda";
import { getEventCategoryLabel } from "../../utils/eventCategory";
import DefaultButton from "../button/DefaultButton";

interface RoomCardProps {
  name: string;
  availability?: RoomAvailability | null;
  agenda?: RoomDailyAgendaItem[];
  onReserve?: () => void;
  onCancelReservation?: () => void;
  isReserving?: boolean;
  isCancellingReservation?: boolean;
}

function formatTimeLabel(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function RoomCard({
  name,
  availability = null,
  agenda = [],
  onReserve,
  onCancelReservation,
  isReserving = false,
  isCancellingReservation = false,
}: RoomCardProps) {
  const status = availability?.status ?? null;
  const reservation = availability?.reservation ?? null;
  const hasAvailability = status != null;
  const isAvailable = status === "available";
  const reservationTitle = reservation?.purpose?.trim() || "Reserva ativa";
  const reservationCategory = reservation
    ? getEventCategoryLabel(reservation.category)
    : null;
  const reservationTime =
    reservation != null
      ? `${formatTimeLabel(reservation.start_at)} - ${formatTimeLabel(
          reservation.end_at,
        )}`
      : null;
  const agendaItems = buildRoomAgendaDisplayItems(agenda, {
    excludeReservationId: !isAvailable ? reservation?.id ?? null : null,
  });
  const canCancelReservation = !isAvailable && typeof onCancelReservation === "function";
  const agendaEmptyMessage = !isAvailable && reservation
    ? "Nenhuma outra reserva para esta sala neste dia."
    : "Nenhuma reserva para esta sala neste dia.";

  return (
    <View className="mb-4 min-h-[80px] rounded-2xl border border-[#ececec] bg-white p-4 shadow-sm">
      <View className="mb-1.5 flex-row items-center justify-between">
        <Text style={{ fontSize: 16, fontWeight: "bold" }}>{name}</Text>
        {hasAvailability ? (
          <View
            style={{
              borderRadius: 999,
              backgroundColor: isAvailable ? "#f8fafc" : "#111827",
              borderColor: isAvailable ? "#e5e7eb" : "#111827",
              borderWidth: 1,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Text
              style={{
                color: isAvailable ? "#111827" : "#ffffff",
                fontSize: 13,
                fontWeight: "700",
              }}
            >
              {isAvailable ? "Disponível" : "Ocupada"}
            </Text>
          </View>
        ) : null}
      </View>

      {!isAvailable && reservation ? (
        <View
          style={{
            backgroundColor: "#f3f4f6",
            borderRadius: 16,
            marginBottom: 12,
            padding: 12,
          }}
        >
          <Text
            style={{
              color: "#6b7280",
              fontSize: 11,
              fontWeight: "700",
              marginBottom: 6,
            }}
          >
            NESTE HORÁRIO
          </Text>
          <Text style={{ color: "#111827", fontSize: 15, fontWeight: "700" }}>
            {reservationTitle}
          </Text>
          <Text style={{ color: "#6b7280", fontSize: 13, marginTop: 2 }}>
            {reservationCategory}
          </Text>
          <View className="mt-1 flex-row items-center">
            <Clock size={15} color="#6b7280" style={{ marginRight: 4 }} />
            <Text style={{ color: "#6b7280", fontSize: 13 }}>
              {reservationTime}
            </Text>
          </View>
        </View>
      ) : null}

      <View
        style={{
          backgroundColor: "#f9fafb",
          borderRadius: 16,
          marginBottom: isAvailable || canCancelReservation ? 12 : 0,
          padding: 12,
        }}
      >
        <Text style={{ color: "#6b7280", fontSize: 12, fontWeight: "700", marginBottom: 8 }}>
          AGENDA DO DIA
        </Text>

        {agendaItems.length === 0 ? (
          <Text style={{ color: "#6b7280", fontSize: 13 }}>
            {agendaEmptyMessage}
          </Text>
        ) : (
          agendaItems.map((item, index) => (
            <View
              key={item.id}
              style={{
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: "#e5e7eb",
                marginTop: index === 0 ? 0 : 10,
                paddingTop: index === 0 ? 0 : 10,
              }}
            >
              <View
                style={{
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <Text style={{ color: "#111827", flex: 1, fontSize: 14, fontWeight: "700" }}>
                  {item.title}
                </Text>
                {item.badgeLabel ? (
                  <View
                    style={{
                      backgroundColor: "#f3f4f6",
                      borderColor: "#d1d5db",
                      borderWidth: 1,
                      borderRadius: 999,
                      marginLeft: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                    }}
                  >
                    <Text style={{ color: "#111827", fontSize: 11, fontWeight: "700" }}>
                      {item.badgeLabel}
                    </Text>
                  </View>
                ) : null}
              </View>

              <Text style={{ color: "#6b7280", fontSize: 13 }}>{item.categoryLabel}</Text>

              <View className="mt-1 flex-row items-center">
                <Clock size={14} color="#6b7280" style={{ marginRight: 4 }} />
                <Text style={{ color: "#6b7280", fontSize: 13 }}>{item.timeLabel}</Text>
              </View>

              {item.scheduleSummaryLabel ? (
                <Text style={{ color: "#374151", fontSize: 12, marginTop: 6 }}>
                  {item.scheduleSummaryLabel}
                </Text>
              ) : null}

              {item.isPrimary ? (
                <View
                  style={{
                    alignSelf: "flex-start",
                    backgroundColor: "#111827",
                    borderRadius: 999,
                    marginTop: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                  }}
                >
                  <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "700" }}>
                    Próxima reserva
                  </Text>
                </View>
              ) : null}
            </View>
          ))
        )}
      </View>

      {isAvailable ? (
        <DefaultButton
          variant="primary"
          onPress={onReserve}
          isLoading={isReserving}
          disabled={!onReserve}
        >
          Reservar
        </DefaultButton>
      ) : canCancelReservation ? (
        <DefaultButton
          variant="destructive"
          onPress={onCancelReservation}
          isLoading={isCancellingReservation}
          disabled={!onCancelReservation}
        >
          Cancelar reserva
        </DefaultButton>
      ) : null}
    </View>
  );
}
