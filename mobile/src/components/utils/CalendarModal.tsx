import { useMemo, useState } from "react";
import { Modal, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { Text } from "react-native-paper";

type Mode = "single" | "range";

interface CalendarModalProps {
  visible: boolean;
  mode?: Mode;
  initialDate?: string; // YYYY-MM-DD
  initialRange?: { startDate?: string; endDate?: string };
  onClose: () => void;
  onConfirm: (payload: { date?: string; startDate?: string; endDate?: string }) => void;
}

export default function CalendarModal({
  visible,
  mode = "single",
  initialDate,
  initialRange,
  onClose,
  onConfirm,
}: CalendarModalProps) {
  const [selectedDate, setSelectedDate] = useState<string | undefined>(initialDate);
  const [range, setRange] = useState<{ startDate?: string; endDate?: string }>(initialRange || {});

  const markedDates = useMemo(() => {
    if (mode === "single" && selectedDate) {
      return {
        [selectedDate]: { selected: true, selectedColor: "#111111", selectedTextColor: "#ffffff" },
      };
    }
    if (mode === "range" && range.startDate && range.endDate) {
      const start = new Date(range.startDate);
      const end = new Date(range.endDate);
      const marks: Record<string, any> = {};
      let cursor = new Date(start);
      while (cursor <= end) {
        const yyyy = cursor.getFullYear();
        const mm = String(cursor.getMonth() + 1).padStart(2, "0");
        const dd = String(cursor.getDate()).padStart(2, "0");
        const key = `${yyyy}-${mm}-${dd}`;
        const isStart = key === range.startDate;
        const isEnd = key === range.endDate;
        marks[key] = {
          startingDay: isStart,
          endingDay: isEnd,
          color: "#111111",
          textColor: "#ffffff",
        };
        cursor.setDate(cursor.getDate() + 1);
      }
      return marks;
    }
    return {};
  }, [mode, selectedDate, range]);

  const canConfirm = mode === "single" ? !!selectedDate : !!(range.startDate && range.endDate);

  // react-native-calendars onDayPress provides this shape
  type DayPressArg = { dateString: string; day: number; month: number; year: number; timestamp: number };

  function onDayPress(day: DayPressArg) {
    const dateStr = day.dateString; // YYYY-MM-DD
    if (mode === "single") {
      setSelectedDate(dateStr);
      return;
    }
    // range selection
    if (!range.startDate || (range.startDate && range.endDate)) {
      setRange({ startDate: dateStr, endDate: undefined });
    } else {
      // choose end
      const start = new Date(range.startDate);
      const end = new Date(dateStr);
      if (end < start) {
        // if user taps a date before start, swap
        setRange({ startDate: dateStr, endDate: range.startDate });
      } else {
        setRange({ startDate: range.startDate, endDate: dateStr });
      }
    }
  }

  function handleConfirm() {
    if (!canConfirm) return;
    if (mode === "single" && selectedDate) {
      onConfirm({ date: selectedDate });
    } else if (range.startDate && range.endDate) {
      onConfirm({ startDate: range.startDate, endDate: range.endDate });
    }
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="bg-white rounded-t-3xl p-5">
          <View className="flex-row items-center mb-3">
            <Text style={{ fontWeight: "bold", fontSize: 16, flex: 1 }}>Selecionar data</Text>
            <Text onPress={onClose} style={{ fontSize: 14 }}>Fechar</Text>
          </View>
          <Calendar
            markingType={mode === "range" ? "period" : undefined}
            markedDates={markedDates}
            onDayPress={onDayPress}
            theme={{
              todayTextColor: "#111111",
              textSectionTitleColor: "#9ca3af",
              monthTextColor: "#111111",
              arrowColor: "#111111",
            }}
          />

          <View className="flex-row gap-4 mt-5">
            <View className="flex-1">
              {/* Outline */}
              <View className="rounded-2xl border-2 py-3.5 justify-center items-center w-full bg-white border-gray-300">
                <Text onPress={onClose} style={{ fontWeight: "600", fontSize: 16 }}>Cancelar</Text>
              </View>
            </View>
            <View className="flex-1 opacity-100">
              <View
                className={`rounded-2xl border-2 py-3.5 justify-center items-center w-full ${canConfirm ? "bg-black border-black" : "bg-gray-200 border-gray-300"
                  }`}
              >
                <Text
                  onPress={canConfirm ? handleConfirm : undefined}
                  style={{ fontWeight: "600", fontSize: 16, color: canConfirm ? "#ffffff" : "#9ca3af" }}
                >
                  Confirmar
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
