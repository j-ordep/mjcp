import { Calendar as CalendarIcon, Clock, X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Chip, Text, TextInput } from "react-native-paper";
import type { EventCategory } from "../../utils/eventCategory";
import { EVENT_CATEGORY_OPTIONS } from "../../utils/eventCategory";
import {
  DEFAULT_ROOM_RESERVATION_START_TIME,
  applyRoomReservationTimeMask,
  buildRoomReservationWindow,
  getDefaultRoomReservationEndTime,
  normalizeRoomReservationTimeValue,
} from "../../utils/roomReservationForm";
import DefaultButton from "../button/DefaultButton";
import CalendarModal from "../utils/CalendarModal";

interface RoomReservationModalProps {
  visible: boolean;
  roomName: string | null;
  initialDate: string;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    title: string;
    category: EventCategory;
    startAt: string;
    endAt: string;
  }) => void | Promise<void>;
}

export default function RoomReservationModal({
  visible,
  roomName,
  initialDate,
  isSaving,
  onClose,
  onSubmit,
}: RoomReservationModalProps) {
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<EventCategory>("geral");
  const [selectedDateISO, setSelectedDateISO] = useState(initialDate);
  const [startTime, setStartTime] = useState(DEFAULT_ROOM_RESERVATION_START_TIME);
  const [endTime, setEndTime] = useState(
    getDefaultRoomReservationEndTime(initialDate, DEFAULT_ROOM_RESERVATION_START_TIME),
  );

  useEffect(() => {
    if (!visible) {
      return;
    }

    setTitle("");
    setCategory("geral");
    setSelectedDateISO(initialDate);
    setStartTime(DEFAULT_ROOM_RESERVATION_START_TIME);
    setEndTime(
      getDefaultRoomReservationEndTime(initialDate, DEFAULT_ROOM_RESERVATION_START_TIME),
    );
  }, [initialDate, visible]);

  const reservationWindow = useMemo(
    () => buildRoomReservationWindow(selectedDateISO, startTime, endTime),
    [endTime, selectedDateISO, startTime],
  );

  const canSubmit = title.trim().length > 0 && reservationWindow != null;
  const [year, month, day] = selectedDateISO.split("-");
  const displayDate = `${day}/${month}/${year}`;

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(15,23,42,0.45)",
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 24,
              }}
            >
              <Pressable
                onPress={onClose}
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                }}
              />

              <View
                style={{
                  width: "100%",
                  maxWidth: 440,
                  maxHeight: "88%",
                  backgroundColor: "#fff",
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    paddingHorizontal: 18,
                    paddingTop: 16,
                    paddingBottom: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "#eef2f7",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={{ fontWeight: "700", fontSize: 20, marginBottom: 4 }}>
                      Reservar sala
                    </Text>
                    <Text style={{ color: "#6b7280" }}>
                      {roomName ? `Nova reserva em ${roomName}.` : "Preencha os dados da reserva."}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={onClose}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: "#f3f4f6",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <X size={18} color="#111827" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingHorizontal: 18,
                    paddingTop: 16,
                    paddingBottom: 16,
                  }}
                >
                  <TextInput
                    label="Titulo da reserva"
                    mode="outlined"
                    value={title}
                    onChangeText={setTitle}
                    activeOutlineColor="#111827"
                    outlineColor="#d1d5db"
                    style={{ marginBottom: 16, backgroundColor: "#fff" }}
                  />

                  <Text
                    style={{ color: "#6b7280", fontSize: 13, fontWeight: "700", marginBottom: 8 }}
                  >
                    CATEGORIA
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
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
                        value={displayDate}
                        editable={false}
                        activeOutlineColor="#111827"
                        outlineColor="#d1d5db"
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
                        onChangeText={(value) => setStartTime(applyRoomReservationTimeMask(value))}
                        onBlur={() =>
                          setStartTime((current) =>
                            normalizeRoomReservationTimeValue(
                              current,
                              DEFAULT_ROOM_RESERVATION_START_TIME,
                            ),
                          )
                        }
                        keyboardType="number-pad"
                        activeOutlineColor="#111827"
                        outlineColor="#d1d5db"
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
                        onChangeText={(value) => setEndTime(applyRoomReservationTimeMask(value))}
                        onBlur={() =>
                          setEndTime((current) =>
                            normalizeRoomReservationTimeValue(
                              current,
                              getDefaultRoomReservationEndTime(selectedDateISO, startTime),
                            ),
                          )
                        }
                        keyboardType="number-pad"
                        activeOutlineColor="#111827"
                        outlineColor="#d1d5db"
                        right={
                          <TextInput.Icon
                            icon={() => <Clock size={20} color="#6b7280" />}
                          />
                        }
                      />
                    </View>
                  </View>

                  {reservationWindow == null ? (
                    <Text style={{ color: "#b91c1c", fontSize: 13, lineHeight: 18 }}>
                      Informe um intervalo valido para salvar a reserva.
                    </Text>
                  ) : null}
                </ScrollView>

                <View
                  style={{
                    paddingHorizontal: 18,
                    paddingTop: 12,
                    paddingBottom: 16,
                    borderTopWidth: 1,
                    borderTopColor: "#eef2f7",
                    backgroundColor: "#fff",
                  }}
                >
                  <DefaultButton
                    onPress={() => {
                      if (!reservationWindow) {
                        return;
                      }

                      Keyboard.dismiss();
                      void onSubmit({
                        title: title.trim(),
                        category,
                        startAt: reservationWindow.startAt,
                        endAt: reservationWindow.endAt,
                      });
                    }}
                    isLoading={isSaving}
                    disabled={!canSubmit}
                  >
                    Salvar reserva
                  </DefaultButton>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

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
    </>
  );
}
