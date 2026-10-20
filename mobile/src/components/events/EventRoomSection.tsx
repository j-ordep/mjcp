import { Text } from "../ui/text";
import { useCallback, useRef, useState } from "react";
import { TouchableOpacity as RNTouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import {
  getRoomsForWindow,
  type RoomAvailability,
} from "../../services/roomReservationService";
import { useAuthStore } from "../../stores/useAuthStore";
import { getEventCategoryLabel } from "../../utils/eventCategory";
import {
  isRoomSelectable,
  reconcileRoomSelection,
  shouldApplyAvailabilityResponse,
} from "../../utils/roomAvailability";

function formatReservationSummary(
  room: RoomAvailability,
  currentEventId?: string,
) {
  const reservation = room.reservation;

  if (!reservation) {
    return "Disponível neste horário.";
  }

  const startAt = new Date(reservation.start_at);
  const endAt = new Date(reservation.end_at);
  const timeLabel =
    Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())
      ? ""
      : `${startAt.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })} - ${endAt.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })}`;

  if (reservation.event_id && reservation.event_id === currentEventId) {
    return `Sala já vinculada a este evento${timeLabel ? ` · ${timeLabel}` : ""}.`;
  }

  const title = reservation.purpose?.trim() || "Reserva ativa";
  const category = getEventCategoryLabel(reservation.category);

  return `${title} · ${category}${timeLabel ? ` · ${timeLabel}` : ""}`;
}

export interface EventRoomSelection {
  selectedRoomId: string | null;
  hasManualRoomSelectionChange: boolean;
  isRoomSelectionAutoCleared: boolean;
}

interface Props {
  singleSelectedDateKey: string | null;
  window: { startAt: string; endAt: string } | null;
  isHydrating: boolean;
  selection: EventRoomSelection;
  currentReservedRoomId: string | null;
  eventId?: string;
  onSelectionChange: (selection: EventRoomSelection) => void;
}

export default function EventRoomSection({
  singleSelectedDateKey,
  window,
  isHydrating,
  selection,
  currentReservedRoomId,
  eventId,
  onSelectionChange,
}: Props) {
  const { sessionRevision } = useAuthStore();
  const [rooms, setRooms] = useState<RoomAvailability[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const selectionRef = useRef(selection);
  const focusedRef = useRef(false);
  const contextRef = useRef({
    window,
    eventId,
    isHydrating,
    currentReservedRoomId,
  });
  const { selectedRoomId, isRoomSelectionAutoCleared } = selection;

  selectionRef.current = selection;
  contextRef.current = { window, eventId, isHydrating, currentReservedRoomId };

  const loadRooms = async () => {
    if (!focusedRef.current || !window || isHydrating) return;

    const requestId = ++requestIdRef.current;
    const authRevision = sessionRevision;
    setIsLoadingRooms(true);
    setRoomsError(null);

    const { data, error } = await getRoomsForWindow(window);
    const latestContext = contextRef.current;
    if (
      !focusedRef.current ||
      authRevision !== useAuthStore.getState().sessionRevision ||
      latestContext.isHydrating ||
      latestContext.eventId !== eventId ||
      latestContext.currentReservedRoomId !== currentReservedRoomId ||
      latestContext.window?.startAt !== window.startAt ||
      latestContext.window?.endAt !== window.endAt ||
      !shouldApplyAvailabilityResponse({
        requestId,
        latestRequestId: requestIdRef.current,
      })
    ) {
      return;
    }

    if (error) {
      setRooms([]);
      setRoomsError(error);
      setIsLoadingRooms(false);
      return;
    }

    const nextRooms = data ?? [];
    const currentSelection = selectionRef.current;
    const nextRoomSelection = reconcileRoomSelection({
      selectedRoomId: currentSelection.selectedRoomId,
      linkedRoomId: currentReservedRoomId,
      rooms: nextRooms,
      currentEventId: eventId,
      hasManualRoomSelectionChange:
        currentSelection.hasManualRoomSelectionChange,
    });

    setRooms(nextRooms);
    setRoomsError(null);
    setIsLoadingRooms(false);

    if (
      nextRoomSelection.selectedRoomId !== currentSelection.selectedRoomId ||
      nextRoomSelection.isRoomSelectionAutoCleared !==
        currentSelection.isRoomSelectionAutoCleared
    ) {
      const nextSelection = { ...currentSelection, ...nextRoomSelection };
      selectionRef.current = nextSelection;
      onSelectionChange(nextSelection);
    }
  };

  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;

      if (!singleSelectedDateKey || isHydrating || !window) {
        requestIdRef.current += 1;
        if (!singleSelectedDateKey) {
          const nextSelection = {
            selectedRoomId: null,
            hasManualRoomSelectionChange: false,
            isRoomSelectionAutoCleared: false,
          };
          selectionRef.current = nextSelection;
          onSelectionChange(nextSelection);
        }
        setRooms([]);
        setRoomsError(null);
        setIsLoadingRooms(false);
      } else {
        void loadRooms();
      }

      return () => {
        focusedRef.current = false;
        requestIdRef.current += 1;
      };
    }, [
      eventId,
      currentReservedRoomId,
      isHydrating,
      window?.startAt,
      window?.endAt,
      singleSelectedDateKey,
      sessionRevision,
    ]),
  );

  const handleSelectRoom = (roomId: string | null) => {
    const nextSelection = {
      selectedRoomId: roomId,
      hasManualRoomSelectionChange: true,
      isRoomSelectionAutoCleared: false,
    };
    // The in-flight query must see a manual change even before the parent rerenders.
    selectionRef.current = nextSelection;
    onSelectionChange(nextSelection);
  };

  return (
    <View
      style={{
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 20,
        padding: 16,
        gap: 12,
      }}
    >
      <View style={{ gap: 4 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: "#111827",
          }}
        >
          Sala (opcional)
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: "#6b7280",
            lineHeight: 18,
          }}
        >
          Vincule uma sala apenas quando o evento tiver uma única data.
        </Text>
      </View>

      {singleSelectedDateKey == null ? (
        <Text style={{ fontSize: 13, color: "#6b7280", lineHeight: 18 }}>
          Se houver múltiplas datas selecionadas, o evento será salvo sem sala.
        </Text>
      ) : !window ? (
        <Text style={{ fontSize: 13, color: "#6b7280", lineHeight: 18 }}>
          Informe uma hora válida para carregar as salas disponíveis.
        </Text>
      ) : (
        <>
          <RNTouchableOpacity
            onPress={() => handleSelectRoom(null)}
            activeOpacity={0.8}
            style={{
              borderWidth: 1,
              borderColor: selectedRoomId === null ? "#111827" : "#e5e7eb",
              borderRadius: 16,
              paddingHorizontal: 14,
              paddingVertical: 14,
              backgroundColor: selectedRoomId === null ? "#111827" : "#ffffff",
            }}
          >
            <Text
              style={{
                color: selectedRoomId === null ? "#ffffff" : "#111827",
                fontWeight: "700",
              }}
            >
              Sem sala
            </Text>
            <Text
              style={{
                color: selectedRoomId === null ? "#e5e7eb" : "#6b7280",
                fontSize: 13,
                marginTop: 4,
              }}
            >
              Salva o evento sem criar ou mantém sem reserva vinculada.
            </Text>
          </RNTouchableOpacity>

          {isLoadingRooms ? (
            <Text style={{ fontSize: 13, color: "#6b7280" }}>
              Carregando salas...
            </Text>
          ) : null}

          {isRoomSelectionAutoCleared && currentReservedRoomId != null ? (
            <Text style={{ fontSize: 13, color: "#b45309", lineHeight: 18 }}>
              Sala vinculada ficou indisponível para o horário atual. Se salvar
              agora, a reserva será removida.
            </Text>
          ) : null}

          {roomsError ? (
            <View
              style={{
                borderWidth: 1,
                borderColor: "#fecaca",
                borderRadius: 16,
                padding: 14,
                gap: 8,
              }}
            >
              <Text style={{ color: "#b91c1c", fontSize: 13 }}>
                {roomsError}
              </Text>
              <RNTouchableOpacity
                onPress={() => void loadRooms()}
                activeOpacity={0.8}
              >
                <Text
                  style={{ color: "#111827", fontSize: 13, fontWeight: "700" }}
                >
                  Tentar novamente
                </Text>
              </RNTouchableOpacity>
            </View>
          ) : null}

          {!isLoadingRooms && !roomsError && rooms.length === 0 ? (
            <Text style={{ fontSize: 13, color: "#6b7280" }}>
              Nenhuma sala cadastrada para este horário.
            </Text>
          ) : null}

          {rooms.map((room) => {
            const isOwnReservation = room.reservation?.event_id === eventId;
            const isSelectable = isRoomSelectable(room, eventId);
            const isSelected = selectedRoomId === room.id;

            return (
              <RNTouchableOpacity
                key={room.id}
                activeOpacity={0.8}
                disabled={!isSelectable}
                onPress={() => {
                  if (isSelectable) {
                    handleSelectRoom(room.id);
                  }
                }}
                style={{
                  borderWidth: 1,
                  borderColor: isSelected ? "#111827" : "#e5e7eb",
                  borderRadius: 16,
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                  backgroundColor: isSelected ? "#111827" : "#ffffff",
                  opacity: isSelectable ? 1 : 0.55,
                  gap: 6,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "700",
                        color: isSelected ? "#ffffff" : "#111827",
                      }}
                    >
                      {room.name}
                    </Text>
                  </View>

                  <View
                    style={{
                      borderRadius: 999,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      backgroundColor:
                        room.status === "available"
                          ? isSelected
                            ? "#ffffff"
                            : "#f3f4f6"
                          : isSelected
                            ? "#374151"
                            : "#111827",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color:
                          room.status === "available" ? "#111827" : "#ffffff",
                      }}
                    >
                      {room.status === "available"
                        ? "Disponível"
                        : isOwnReservation
                          ? "Neste evento"
                          : "Ocupada"}
                    </Text>
                  </View>
                </View>

                <Text
                  style={{
                    fontSize: 13,
                    lineHeight: 18,
                    color: isSelected ? "#e5e7eb" : "#6b7280",
                  }}
                >
                  {formatReservationSummary(room, eventId)}
                </Text>

                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: isSelected ? "#ffffff" : "#111827",
                  }}
                >
                  {isSelected
                    ? "Sala selecionada"
                    : isSelectable
                      ? "Toque para selecionar"
                      : "Indisponível para este horário"}
                </Text>
              </RNTouchableOpacity>
            );
          })}
        </>
      )}
    </View>
  );
}
