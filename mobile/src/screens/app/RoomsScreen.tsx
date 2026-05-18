import { Calendar as CalendarIcon, Clock } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, ScrollView, TouchableOpacity, View } from "react-native";
import { Chip, Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import RoomCard from "../../components/card/RoomCard";
import HeaderSecondary from "../../components/Header/HeaderSecondary";
import CalendarModal from "../../components/utils/CalendarModal";
import {
  cancelStandaloneRoomReservation,
  createStandaloneRoomReservation,
  getRoomsDailyAgenda,
  getRoomsForWindow,
  type RoomAvailability,
  type RoomDailyAgendaRoom,
} from "../../services/roomReservationService";
import { useAuthStore } from "../../stores/useAuthStore";
import { formatLocalDateKey, getDefaultEndAt, getNow } from "../../utils/eventDate";
import {
  EVENT_CATEGORY_OPTIONS,
  type EventCategory,
} from "../../utils/eventCategory";
import {
  canCancelStandaloneRoomReservation,
  canCreateStandaloneRoomReservation,
  getRefreshAvailabilityWindow,
  shouldApplyAvailabilityResponse,
} from "../../utils/roomAvailability";

function formatDisplayDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-");
  return `${day}/${month}/${year}`;
}

function pluralizeRooms(count: number) {
  return `${count} ${count === 1 ? "sala disponível" : "salas disponíveis"}`;
}

function applyTimeMask(value: string) {
  let clean = value.replace(/\D/g, "");

  if (clean.length > 4) {
    clean = clean.slice(0, 4);
  }

  if (clean.length <= 2) {
    return clean;
  }

  return `${clean.slice(0, 2)}:${clean.slice(2)}`;
}

function normalizeTimeValue(value: string, fallback: string) {
  if (!value.trim()) {
    return fallback;
  }

  let clean = value.replace(/\D/g, "");
  let hours = fallback.slice(0, 2);
  let minutes = fallback.slice(3, 5);

  if (clean.length <= 2) {
    hours = clean.padStart(2, "0");
  } else if (clean.length === 3) {
    hours = clean.slice(0, 1).padStart(2, "0");
    minutes = clean.slice(1).padStart(2, "0");
  } else {
    hours = clean.slice(0, 2);
    minutes = clean.slice(2, 4);
  }

  const hoursNumber = Number.parseInt(hours, 10);
  const minutesNumber = Number.parseInt(minutes, 10);

  return `${String(Math.min(hoursNumber, 23)).padStart(2, "0")}:${String(
    Math.min(minutesNumber, 59),
  ).padStart(2, "0")}`;
}

function isValidTimeValue(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value.trim());

  if (!match) {
    return false;
  }

  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);

  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

function buildReservationWindow(dateKey: string, startTime: string, endTime: string) {
  if (!isValidTimeValue(startTime) || !isValidTimeValue(endTime)) {
    return null;
  }

  const startDate = new Date(`${dateKey}T${startTime}:00`);
  const endDate = new Date(`${dateKey}T${endTime}:00`);

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    endDate.getTime() <= startDate.getTime()
  ) {
    return null;
  }

  return {
    startAt: startDate.toISOString(),
    endAt: endDate.toISOString(),
  };
}

export default function RoomsScreen({ navigation }) {
  const { session } = useAuthStore();
  const initialDate = formatLocalDateKey(getNow());
  const defaultStart = "19:00";
  const defaultEnd = new Date(
    getDefaultEndAt(new Date(`${initialDate}T${defaultStart}:00`)),
  )
    .toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .slice(0, 5);

  const [selectedDateISO, setSelectedDateISO] = useState(initialDate);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [startTime, setStartTime] = useState(defaultStart);
  const [endTime, setEndTime] = useState(defaultEnd);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<EventCategory>("geral");
  const [availabilityRooms, setAvailabilityRooms] = useState<RoomAvailability[]>([]);
  const [dailyAgendaRooms, setDailyAgendaRooms] = useState<RoomDailyAgendaRoom[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isLoadingDailyAgenda, setIsLoadingDailyAgenda] = useState(false);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [dailyAgendaError, setDailyAgendaError] = useState<string | null>(null);
  const [submittingRoomId, setSubmittingRoomId] = useState<string | null>(null);
  const [cancellingReservationId, setCancellingReservationId] = useState<string | null>(null);
  const availabilityRequestIdRef = useRef(0);
  const dailyAgendaRequestIdRef = useRef(0);
  const currentUserId = session?.user?.id ?? null;

  const reservationWindow = useMemo(
    () => buildReservationWindow(selectedDateISO, startTime, endTime),
    [endTime, selectedDateISO, startTime],
  );
  const reservationWindowRef = useRef(reservationWindow);

  useEffect(() => {
    reservationWindowRef.current = reservationWindow;
  }, [reservationWindow]);

  const loadRooms = async (window = reservationWindow) => {
    const requestId = ++availabilityRequestIdRef.current;

    if (!window) {
      setAvailabilityRooms([]);
      setRoomsError(null);
      setIsLoadingRooms(false);
      return;
    }

    setIsLoadingRooms(true);
    setRoomsError(null);

    const { data, error } = await getRoomsForWindow(window);
    if (
      !shouldApplyAvailabilityResponse({
        requestId,
        latestRequestId: availabilityRequestIdRef.current,
      })
    ) {
      return;
    }

    if (error) {
      setAvailabilityRooms([]);
      setRoomsError(error);
    } else {
      setAvailabilityRooms(data ?? []);
      setRoomsError(null);
    }

    setIsLoadingRooms(false);
  };

  const loadDailyAgenda = async (dateKey = selectedDateISO) => {
    const requestId = ++dailyAgendaRequestIdRef.current;

    setIsLoadingDailyAgenda(true);
    setDailyAgendaError(null);

    const { data, error } = await getRoomsDailyAgenda(dateKey);

    if (requestId !== dailyAgendaRequestIdRef.current) {
      return;
    }

    if (error) {
      setDailyAgendaRooms([]);
      setDailyAgendaError(error);
    } else {
      setDailyAgendaRooms(data ?? []);
      setDailyAgendaError(null);
    }

    setIsLoadingDailyAgenda(false);
  };

  useEffect(() => {
    void loadRooms();
  }, [reservationWindow?.endAt, reservationWindow?.startAt]);

  useEffect(() => {
    void loadDailyAgenda();
  }, [selectedDateISO]);

  const handleReserve = async (roomId: string) => {
    if (!title.trim()) {
      Alert.alert("Erro", "Informe o título da reserva.");
      return;
    }

    if (!reservationWindow) {
      Alert.alert("Erro", "Defina uma data e um intervalo de horário válido.");
      return;
    }

    setSubmittingRoomId(roomId);

    const { error } = await createStandaloneRoomReservation({
      roomId,
      title: title.trim(),
      category,
      startAt: reservationWindow.startAt,
      endAt: reservationWindow.endAt,
    });

    setSubmittingRoomId(null);

    if (error) {
      Alert.alert("Erro ao reservar", error);
      return;
    }

    Alert.alert("Reserva criada", "Sala reservada com sucesso.");
    await Promise.all([
      loadRooms(
        getRefreshAvailabilityWindow({
          latestWindow: reservationWindowRef.current,
          fallbackWindow: reservationWindow,
        }),
      ),
      loadDailyAgenda(selectedDateISO),
    ]);
  };

  const handleCancelReservation = (reservationId: string) => {
    Alert.alert(
      "Cancelar reserva",
      "Esta ação cancela apenas a sua reserva avulsa desta sala.",
      [
        { text: "Voltar", style: "cancel" },
        {
          text: "Cancelar reserva",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setCancellingReservationId(reservationId);

              const { error } = await cancelStandaloneRoomReservation(reservationId);

              setCancellingReservationId(null);

              if (error) {
                Alert.alert("Erro ao cancelar", error);
                return;
              }

              Alert.alert("Reserva cancelada", "A sala voltou a ficar disponível.");
              await Promise.all([
                loadRooms(
                  getRefreshAvailabilityWindow({
                    latestWindow: reservationWindowRef.current,
                    fallbackWindow: reservationWindow,
                  }),
                ),
                loadDailyAgenda(selectedDateISO),
              ]);
            })();
          },
        },
      ],
    );
  };

  const availableRoomsCount = availabilityRooms.filter(
    (room) => room.status === "available",
  ).length;
  const canSubmitReservation = canCreateStandaloneRoomReservation({
    title,
    reservationWindow,
  });
  const availabilityByRoomId = useMemo(
    () => new Map(availabilityRooms.map((room) => [room.id, room])),
    [availabilityRooms],
  );
  const displayRooms = dailyAgendaRooms.length > 0 || !dailyAgendaError
    ? dailyAgendaRooms
    : availabilityRooms.map((room) => ({
        id: room.id,
        name: room.name,
        capacity: room.capacity,
        description: room.description,
        agenda: [],
      }));
  const showAgendaPlaceholders =
    isLoadingDailyAgenda &&
    !dailyAgendaError &&
    dailyAgendaRooms.length === 0 &&
    displayRooms.length === 0;
  const roomsSummaryLabel = reservationWindow
    ? `${formatDisplayDate(selectedDateISO)} • ${startTime} - ${endTime} • ${pluralizeRooms(
        availableRoomsCount,
      )}`
    : `${formatDisplayDate(selectedDateISO)} • ajuste o horário para ver a disponibilidade`;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <HeaderSecondary
        title="Salas"
        onBack={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
            return;
          }

          navigation.navigate("Home");
        }}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: "#6b7280", fontSize: 13, fontWeight: "700", marginBottom: 8 }}>
            RESERVA AVULSA
          </Text>
          <TextInput
            label="Título da reserva"
            mode="outlined"
            value={title}
            onChangeText={setTitle}
            activeOutlineColor="#000"
            style={{ marginBottom: 12 }}
          />

          <Text style={{ color: "#6b7280", fontSize: 13, fontWeight: "700", marginBottom: 8 }}>
            CATEGORIA
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {EVENT_CATEGORY_OPTIONS.map((option) => {
              const selected = category === option.value;

              return (
                <Chip
                  key={option.value}
                  selected={selected}
                  showSelectedCheck={false}
                  onPress={() => setCategory(option.value)}
                  style={{
                    backgroundColor: selected ? "#111827" : "#f3f4f6",
                    borderColor: selected ? "#111827" : "#e5e7eb",
                    borderWidth: 1,
                  }}
                  textStyle={{
                    color: selected ? "#fff" : "#374151",
                    fontWeight: selected ? "bold" : "normal",
                  }}
                >
                  {option.label}
                </Chip>
              );
            })}
          </View>

          <TouchableOpacity
            style={{ marginBottom: 12 }}
            activeOpacity={0.8}
            onPress={() => setCalendarVisible(true)}
          >
            <View pointerEvents="none">
              <TextInput
                label="Data"
                mode="outlined"
                value={formatDisplayDate(selectedDateISO)}
                editable={false}
                activeOutlineColor="#000"
                right={
                  <TextInput.Icon
                    icon={() => <CalendarIcon size={20} color="#6b7280" />}
                  />
                }
              />
            </View>
          </TouchableOpacity>

          <View style={{ flexDirection: "row", gap: 12, marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <TextInput
                label="Hora inicial"
                mode="outlined"
                value={startTime}
                onChangeText={(value) => setStartTime(applyTimeMask(value))}
                onBlur={() => setStartTime((current) => normalizeTimeValue(current, defaultStart))}
                keyboardType="number-pad"
                activeOutlineColor="#000"
                right={
                  <TextInput.Icon
                    icon={() => <Clock size={20} color="#6b7280" />}
                  />
                }
              />
            </View>

            <View style={{ flex: 1 }}>
              <TextInput
                label="Hora final"
                mode="outlined"
                value={endTime}
                onChangeText={(value) => setEndTime(applyTimeMask(value))}
                onBlur={() => setEndTime((current) => normalizeTimeValue(current, defaultEnd))}
                keyboardType="number-pad"
                activeOutlineColor="#000"
                right={
                  <TextInput.Icon
                    icon={() => <Clock size={20} color="#6b7280" />}
                  />
                }
              />
            </View>
          </View>

          {!reservationWindow ? (
            <Text style={{ color: "#b91c1c", fontSize: 13, lineHeight: 18 }}>
              Informe um intervalo válido para verificar disponibilidade e reservar.
            </Text>
          ) : null}
        </View>

        <View
          style={{
            marginBottom: 12,
          }}
        >
          <Text style={{ color: "#111827", fontSize: 14, fontWeight: "700", marginBottom: 4 }}>
            {roomsSummaryLabel}
          </Text>
          <View
            style={{
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ color: "#6b7280", fontSize: 13 }}>
              Agenda do dia por sala
            </Text>
            {isLoadingRooms || isLoadingDailyAgenda ? (
              <Text style={{ color: "#6b7280", fontSize: 13 }}>Carregando agenda...</Text>
            ) : null}
          </View>
        </View>

        {showAgendaPlaceholders ? (
          <>
            {[0, 1].map((placeholder) => (
              <View
                key={placeholder}
                style={{
                  backgroundColor: "#ffffff",
                  borderColor: "#ececec",
                  borderRadius: 24,
                  borderWidth: 1,
                  marginBottom: 16,
                  padding: 16,
                }}
              >
                <View
                  style={{
                    backgroundColor: "#f3f4f6",
                    borderRadius: 8,
                    height: 18,
                    marginBottom: 12,
                    width: "40%",
                  }}
                />
                <View
                  style={{
                    backgroundColor: "#f9fafb",
                    borderRadius: 16,
                    padding: 12,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "#f3f4f6",
                      borderRadius: 8,
                      height: 14,
                      marginBottom: 10,
                      width: "30%",
                    }}
                  />
                  <View
                    style={{
                      backgroundColor: "#f3f4f6",
                      borderRadius: 8,
                      height: 16,
                      marginBottom: 8,
                      width: "70%",
                    }}
                  />
                  <View
                    style={{
                      backgroundColor: "#f3f4f6",
                      borderRadius: 8,
                      height: 14,
                      width: "45%",
                    }}
                  />
                </View>
              </View>
            ))}
          </>
        ) : null}

        {dailyAgendaError ? (
          <View
            style={{
              borderColor: "#fecaca",
              borderRadius: 16,
              borderWidth: 1,
              marginBottom: 16,
              padding: 14,
            }}
          >
            <Text style={{ color: "#b91c1c", fontSize: 13, marginBottom: 10 }}>
              {dailyAgendaError}
            </Text>
            <TouchableOpacity
              onPress={() => void loadDailyAgenda()}
              activeOpacity={0.8}
            >
              <Text style={{ color: "#111827", fontSize: 13, fontWeight: "700" }}>
                Tentar novamente agenda do dia
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {roomsError ? (
          <View
            style={{
              borderColor: "#fecaca",
              borderRadius: 16,
              borderWidth: 1,
              marginBottom: 16,
              padding: 14,
            }}
          >
            <Text style={{ color: "#b91c1c", fontSize: 13, marginBottom: 10 }}>
              {roomsError}
            </Text>
            <TouchableOpacity onPress={() => void loadRooms()} activeOpacity={0.8}>
              <Text style={{ color: "#111827", fontSize: 13, fontWeight: "700" }}>
                Tentar novamente disponibilidade
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!showAgendaPlaceholders &&
        !isLoadingDailyAgenda &&
        !dailyAgendaError &&
        displayRooms.length === 0 ? (
          <Text style={{ color: "#6b7280", fontSize: 13 }}>
            Nenhuma sala cadastrada.
          </Text>
        ) : null}

        {!showAgendaPlaceholders && displayRooms.map((room) => {
          const availability = availabilityByRoomId.get(room.id) ?? null;
          const canCancelReservation = canCancelStandaloneRoomReservation({
            currentUserId,
            reservation: availability?.reservation,
          });
          const reservationId = availability?.reservation?.id ?? null;

          return (
            <RoomCard
              key={room.id}
              name={room.name}
              availability={availability}
              agenda={room.agenda}
              isReserving={submittingRoomId === room.id}
              isCancellingReservation={
                reservationId != null && cancellingReservationId === reservationId
              }
              onReserve={
                availability?.status === "available" && canSubmitReservation
                  ? () => {
                      void handleReserve(room.id);
                    }
                  : undefined
              }
              onCancelReservation={
                canCancelReservation && reservationId
                  ? () => {
                      handleCancelReservation(reservationId);
                    }
                  : undefined
              }
            />
          );
        })}
      </ScrollView>

      <CalendarModal
        visible={calendarVisible}
        mode="single"
        initialDate={selectedDateISO}
        onClose={() => setCalendarVisible(false)}
        onConfirm={(payload) => {
          if (payload.date) {
            setSelectedDateISO(payload.date);
          }
        }}
      />
    </SafeAreaView>
  );
}
