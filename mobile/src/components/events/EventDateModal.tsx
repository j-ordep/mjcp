import { colors } from "../../theme/colors";
import { Text } from "../ui/text";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { Modal, TouchableOpacity as RNTouchableOpacity, View } from "react-native";

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
          backgroundColor: colors.overlay,
          justifyContent: "center",
          alignItems: "center",
        }}
        activeOpacity={1}
        onPress={() => setShowCalendar(false)}
      >
        <View
          style={{
            width: "90%",
            backgroundColor: colors.surface,
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
              <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                {isEdit
                  ? "Toque para escolher um novo dia"
                  : isMultipleDateSelectionEnabled
                    ? "Toque para selecionar ou remover várias datas"
                    : "Por padrão, apenas uma data fica ativa por vez"}
              </Text>
            </View>

            <RNTouchableOpacity onPress={() => setShowCalendar(false)}>
              <X size={24} color={colors.foreground} />
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
                <Text style={{ fontWeight: "700", color: colors.foreground }}>
                  Permitir múltiplas datas
                </Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
                  Desativado por padrão para manter a criação mais simples.
                </Text>
              </View>
              <Checkbox
                checked={isMultipleDateSelectionEnabled}
                onCheckedChange={handleToggleMultipleDates}
                onPress={(event) => event.stopPropagation()}
                accessibilityLabel="Permitir múltiplas datas"
              />
            </RNTouchableOpacity>
          ) : null}

          <Calendar
            onDayPress={onDayPress}
            markedDates={selectedDays}
            theme={{
              calendarBackground: colors.surface,
              dayTextColor: colors.foreground,
              selectedDayTextColor: colors.primaryForeground,
              textSectionTitleColor: colors.mutedForeground,
              selectedDayBackgroundColor: colors.primary,
              todayTextColor: colors.primary,
              arrowColor: colors.primary,
              monthTextColor: colors.foreground,
              indicatorColor: colors.primary,
            }}
          />

          <Button
            variant="default"
            onPress={() => setShowCalendar(false)}
            style={{ marginTop: 10, backgroundColor: colors.primary }}
          >
            <Text>
              {isMultipleDateSelectionEnabled && selectedDateKeys.length > 1
                ? `Confirmar ${selectedDateKeys.length} datas`
                : "Confirmar data"}
            </Text>
          </Button>
        </View>
      </RNTouchableOpacity>
    </Modal>
  );
}
