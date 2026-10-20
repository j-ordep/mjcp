import { Text } from "../ui/text";
import { Input } from "../ui/input";
import { Calendar as CalendarIcon, Clock, X } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import type { TriggerRef } from "@rn-primitives/select";
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
import { SelectField } from "../ui/select-field";
import { PortalHost, useModalPortalRoot } from "@rn-primitives/portal";
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
  const modalPortal = useModalPortalRoot();
  const categoryTriggerRef = useRef<TriggerRef>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
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
      setCategoryOpen(false);
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
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {
        if (categoryOpen) categoryTriggerRef.current?.close();
        else onClose();
      }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View
              ref={modalPortal.ref}
              onLayout={modalPortal.onLayout}
              style={[modalPortal.style, {
                flex: 1,
                backgroundColor: "rgba(15,23,42,0.45)",
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 24,
              }]}
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
                  <Input
                    label="Titulo da reserva"
                    value={title}
                    onChangeText={setTitle}
                    containerStyle={{ marginBottom: 16 }}
                    style={{ backgroundColor: "#fff" }}
                  />

                  <SelectField
                    label="CATEGORIA"
                    value={category}
                    options={EVENT_CATEGORY_OPTIONS.map(({ value, label }) => ({ value, label }))}
                    onValueChange={(value) => {
                      const option = EVENT_CATEGORY_OPTIONS.find((item) => item.value === value);
                      if (option) setCategory(option.value);
                    }}
                    portalHost="room-reservation-select"
                    sideOffset={modalPortal.sideOffset}
                    triggerRef={categoryTriggerRef}
                    onOpenChange={setCategoryOpen}
                    containerStyle={{ marginBottom: 16 }}
                  />

                  <TouchableOpacity
                    style={{ marginBottom: 12 }}
                    activeOpacity={0.8}
                    onPress={() => setCalendarVisible(true)}
                  >
                    <View pointerEvents="none">
                      <Input
                        label="Data"
                        value={displayDate}
                        editable={false}
                        right={
                          <CalendarIcon size={20} color="#6b7280" />
                        }
                      />
                    </View>
                  </TouchableOpacity>

                  <View style={{ flexDirection: "row", gap: 12, marginBottom: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Input
                        label="Hora inicial"
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
                        right={
                          <Clock size={20} color="#6b7280" />
                        }
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Input
                        label="Hora final"
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
                        right={
                          <Clock size={20} color="#6b7280" />
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
              <PortalHost name="room-reservation-select" />
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
