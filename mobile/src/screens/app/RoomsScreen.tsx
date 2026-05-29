import { Calendar as CalendarIcon } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import RoomCard from "../../components/card/RoomCard";
import HeaderSecondary from "../../components/Header/HeaderSecondary";
import RoomReservationModal from "../../components/rooms/RoomReservationModal";
import CalendarModal from "../../components/utils/CalendarModal";
import {
  cancelStandaloneRoomReservation,
  createStandaloneRoomReservation,
  getRoomsDailyAgenda,
  type RoomDailyAgendaRoom,
} from "../../services/roomReservationService";
import { useAuthStore } from "../../stores/useAuthStore";
import { formatLocalDateKey, getNow } from "../../utils/eventDate";
import type { EventCategory } from "../../utils/eventCategory";

function formatDisplayDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-");
  return `${day}/${month}/${year}`;
}

function pluralize(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export default function RoomsScreen({ navigation }) {
  const { session } = useAuthStore();
  const initialDate = formatLocalDateKey(getNow());
  const [selectedDateISO, setSelectedDateISO] = useState(initialDate);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [reservationTarget, setReservationTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [dailyAgendaRooms, setDailyAgendaRooms] = useState<RoomDailyAgendaRoom[]>([]);
  const [isLoadingDailyAgenda, setIsLoadingDailyAgenda] = useState(false);
  const [dailyAgendaError, setDailyAgendaError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [submittingRoomId, setSubmittingRoomId] = useState<string | null>(null);
  const [cancellingReservationId, setCancellingReservationId] = useState<string | null>(null);
  const dailyAgendaRequestIdRef = useRef(0);
  const currentUserId = session?.user?.id ?? null;

  const loadDailyAgenda = useCallback(async (dateKey = selectedDateISO) => {
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
  }, [selectedDateISO]);

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadDailyAgenda(selectedDateISO);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadDailyAgenda, selectedDateISO]);

  useEffect(() => {
    void loadDailyAgenda(selectedDateISO);
  }, [loadDailyAgenda, selectedDateISO]);

  const handleCreateReservation = async (payload: {
    title: string;
    category: EventCategory;
    startAt: string;
    endAt: string;
  }) => {
    if (!reservationTarget) {
      return;
    }

    setSubmittingRoomId(reservationTarget.id);

    const { error } = await createStandaloneRoomReservation({
      roomId: reservationTarget.id,
      title: payload.title,
      category: payload.category,
      startAt: payload.startAt,
      endAt: payload.endAt,
    });

    setSubmittingRoomId(null);

    if (error) {
      Alert.alert(
        "Erro ao reservar",
        "A reserva nao foi criada. Tente novamente em alguns instantes.",
      );
      return;
    }

    setReservationTarget(null);
    Alert.alert("Reserva criada", "Sala reservada com sucesso.");
    await loadDailyAgenda(selectedDateISO);
  };

  const handleCancelReservation = (reservationId: string) => {
    Alert.alert(
      "Cancelar reserva",
      "Esta acao cancela apenas a sua reserva avulsa desta sala.",
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
                Alert.alert(
                  "Erro ao cancelar",
                  "A reserva nao foi cancelada. Tente novamente em alguns instantes.",
                );
                return;
              }

              Alert.alert("Reserva cancelada", "A sala voltou a ficar disponivel.");
              await loadDailyAgenda(selectedDateISO);
            })();
          },
        },
      ],
    );
  };

  const totalReservations = useMemo(
    () => dailyAgendaRooms.reduce((sum, room) => sum + room.agenda.length, 0),
    [dailyAgendaRooms],
  );
  const roomsSummaryLabel =
    `${formatDisplayDate(selectedDateISO)} • ${pluralize(dailyAgendaRooms.length, "sala", "salas")}`;
  const roomsSummaryCaption =
    `${pluralize(totalReservations, "reserva", "reservas")} registradas no dia`;
  const showAgendaPlaceholders =
    isLoadingDailyAgenda && !dailyAgendaError && dailyAgendaRooms.length === 0;

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
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void refreshAll()}
          />
        }
      >
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: "#6b7280", fontSize: 13, fontWeight: "700", marginBottom: 8 }}>
            AGENDA DAS SALAS
          </Text>

          <TouchableOpacity activeOpacity={0.8} onPress={() => setCalendarVisible(true)}>
            <View pointerEvents="none">
              <TextInput
                label="Data da agenda"
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

          <Text style={{ color: "#6b7280", fontSize: 13, lineHeight: 18, marginTop: 10 }}>
            Use a agenda do dia para ver a ocupacao de cada sala e toque em Reservar
            quando quiser criar uma nova reserva avulsa.
          </Text>
        </View>

        <View style={{ marginBottom: 12 }}>
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
            <Text style={{ color: "#6b7280", fontSize: 13 }}>{roomsSummaryCaption}</Text>
            {isLoadingDailyAgenda ? (
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
              onPress={() => void loadDailyAgenda(selectedDateISO)}
              activeOpacity={0.8}
            >
              <Text style={{ color: "#111827", fontSize: 13, fontWeight: "700" }}>
                Tentar novamente agenda do dia
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!showAgendaPlaceholders &&
        !isLoadingDailyAgenda &&
        !dailyAgendaError &&
        dailyAgendaRooms.length === 0 ? (
          <Text style={{ color: "#6b7280", fontSize: 13 }}>
            Nenhuma sala cadastrada.
          </Text>
        ) : null}

        {!showAgendaPlaceholders &&
          dailyAgendaRooms.map((room) => (
            <RoomCard
              key={room.id}
              name={room.name}
              agenda={room.agenda}
              currentUserId={currentUserId}
              isReserving={submittingRoomId === room.id}
              isCancellingReservationId={cancellingReservationId}
              onReserve={() => setReservationTarget({ id: room.id, name: room.name })}
              onCancelReservation={handleCancelReservation}
            />
          ))}
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

      <RoomReservationModal
        visible={reservationTarget != null}
        roomName={reservationTarget?.name ?? null}
        initialDate={selectedDateISO}
        isSaving={reservationTarget != null && submittingRoomId === reservationTarget.id}
        onClose={() => setReservationTarget(null)}
        onSubmit={handleCreateReservation}
      />
    </SafeAreaView>
  );
}
