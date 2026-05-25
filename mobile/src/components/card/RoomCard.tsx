import { Clock } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";
import type { RoomDailyAgendaItem } from "../../services/roomReservationService";
import { buildRoomAgendaDisplayItems } from "../../utils/roomAgenda";
import { canCancelStandaloneRoomAgendaItem } from "../../utils/roomAvailability";
import { buildRoomReservationStatusLabel } from "../../utils/roomReservationForm";
import DefaultButton from "../button/DefaultButton";

interface RoomCardProps {
  name: string;
  agenda?: RoomDailyAgendaItem[];
  onReserve?: () => void;
  onCancelReservation?: (reservationId: string) => void;
  isReserving?: boolean;
  isCancellingReservationId?: string | null;
  currentUserId?: string | null;
}

export default function RoomCard({
  name,
  agenda = [],
  onReserve,
  onCancelReservation,
  isReserving = false,
  isCancellingReservationId = null,
  currentUserId = null,
}: RoomCardProps) {
  const agendaItems = buildRoomAgendaDisplayItems(agenda);
  const agendaItemById = new Map(agenda.map((item) => [item.id, item]));
  const hasReservations = agenda.length > 0;

  return (
    <View className="mb-4 min-h-[80px] rounded-2xl border border-[#ececec] bg-white p-4 shadow-sm">
      <View className="mb-1.5 flex-row items-center justify-between">
        <Text style={{ fontSize: 16, fontWeight: "bold" }}>{name}</Text>
        <View
          style={{
            borderRadius: 999,
            backgroundColor: hasReservations ? "#111827" : "#f8fafc",
            borderColor: hasReservations ? "#111827" : "#e5e7eb",
            borderWidth: 1,
            paddingHorizontal: 12,
            paddingVertical: 6,
          }}
        >
          <Text
            style={{
              color: hasReservations ? "#ffffff" : "#111827",
              fontSize: 13,
              fontWeight: "700",
            }}
          >
            {buildRoomReservationStatusLabel(agenda.length)}
          </Text>
        </View>
      </View>

      <View
        style={{
          backgroundColor: "#f9fafb",
          borderRadius: 16,
          marginBottom: 12,
          padding: 12,
        }}
      >
        <Text style={{ color: "#6b7280", fontSize: 12, fontWeight: "700", marginBottom: 8 }}>
          AGENDA DO DIA
        </Text>

        {agendaItems.length === 0 ? (
          <Text style={{ color: "#6b7280", fontSize: 13 }}>
            Nenhuma reserva para esta sala neste dia.
          </Text>
        ) : (
          agendaItems.map((item, index) => {
            const agendaItem = agendaItemById.get(item.id) ?? null;
            const canCancelReservation =
              typeof onCancelReservation === "function" &&
              canCancelStandaloneRoomAgendaItem({
                currentUserId,
                reservation: agendaItem,
              });

            return (
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
                      Proxima reserva
                    </Text>
                  </View>
                ) : null}

                {canCancelReservation && agendaItem ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={isCancellingReservationId === agendaItem.id}
                    onPress={() => onCancelReservation(agendaItem.id)}
                    style={{ alignSelf: "flex-start", marginTop: 10 }}
                  >
                    <Text style={{ color: "#b91c1c", fontSize: 12, fontWeight: "700" }}>
                      {isCancellingReservationId === agendaItem.id
                        ? "Cancelando reserva..."
                        : "Cancelar reserva"}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })
        )}
      </View>

      <DefaultButton variant="primary" onPress={onReserve} isLoading={isReserving} disabled={!onReserve}>
        Reservar
      </DefaultButton>
    </View>
  );
}
