import { Modal, TouchableOpacity as RNTouchableOpacity, View } from "react-native";
import { Button, Checkbox, Text } from "react-native-paper";
import { Calendar } from "react-native-calendars";
import { X } from "lucide-react-native";
import type { CalendarSelectionMark } from "../../utils/eventCalendarSelection";

interface Props {
  showCalendar: boolean;
  setShowCalendar: (visible: boolean) => void;
  isEdit: boolean;
  isMultipleDateSelectionEnabled: boolean;
  handleToggleMultipleDates: () => void;
  onDayPress: (day: { dateString: string }) => void;
  selectedDays: Record<string, CalendarSelectionMark>;
}

export default function EventDateModal({
  showCalendar, setShowCalendar, isEdit, isMultipleDateSelectionEnabled,
  handleToggleMultipleDates, onDayPress, selectedDays,
}: Props) {
  const selectedDateKeys = Object.keys(selectedDays);
  return (
    <Modal
      visible={showCalendar}
      transparent
      animationType="fade"
      onRequestClose={() => setShowCalendar(false)}
    >
      <RNTouchableOpacity
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          alignItems: "center",
        }}
        activeOpacity={1}
        onPress={() => setShowCalendar(false)}
      >
        <View
          style={{
            width: "90%",
            backgroundColor: "#fff",
            borderRadius: 16,
            overflow: "hidden",
            padding: 10,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 10,
            }}
          >
            <View>
              <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                {isEdit
                  ? "Alterar Data"
                  : isMultipleDateSelectionEnabled
                    ? "Selecione as Datas"
                    : "Selecione a Data"}
              </Text>
              <Text style={{ fontSize: 12, color: "#666" }}>
                {isEdit
                  ? "Toque para escolher um novo dia"
                  : isMultipleDateSelectionEnabled
                    ? "Toque para selecionar ou remover várias datas"
                    : "Por padrão, apenas uma data fica ativa por vez"}
              </Text>
            </View>

            <RNTouchableOpacity onPress={() => setShowCalendar(false)}>
              <X size={24} color="#000" />
            </RNTouchableOpacity>
          </View>

          {!isEdit ? (
            <RNTouchableOpacity
              onPress={handleToggleMultipleDates}
              activeOpacity={0.8}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 10,
                paddingBottom: 10,
              }}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontWeight: "700", color: "#111827" }}>
                  Permitir múltiplas datas
                </Text>
                <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                  Desativado por padrão para manter a criação mais simples.
                </Text>
              </View>
              <Checkbox
                status={isMultipleDateSelectionEnabled ? "checked" : "unchecked"}
              />
            </RNTouchableOpacity>
          ) : null}

          <Calendar
            onDayPress={onDayPress}
            markedDates={selectedDays}
            theme={{
              selectedDayBackgroundColor: "#000",
              todayTextColor: "#000",
              arrowColor: "#000",
              monthTextColor: "#000",
              indicatorColor: "#000",
            }}
          />

          <Button
            mode="contained"
            onPress={() => setShowCalendar(false)}
            style={{ marginTop: 10, backgroundColor: "#000" }}
          >
            {isMultipleDateSelectionEnabled && selectedDateKeys.length > 1
              ? `Confirmar ${selectedDateKeys.length} datas`
              : "Confirmar data"}
          </Button>
        </View>
      </RNTouchableOpacity>
    </Modal>
  );
}
