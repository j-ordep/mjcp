import { useState } from "react";
import { View } from "react-native";
import { Calendar } from "react-native-calendars";
import { Divider, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderSecondary from "../../components/Header/HeaderSecondary";
import DefaultButton from "../../components/button/DefaultButton";

export default function BlockDatesScreen() {
  const [selectedDates, setSelectedDates] = useState<Record<string, true>>({});

  const selectedCount = Object.keys(selectedDates).length;
  const canBlock = selectedCount > 0;

  const markedDates = Object.keys(selectedDates).reduce<Record<string, any>>((acc, key) => {
    acc[key] = { selected: true, selectedColor: "#111111", selectedTextColor: "#ffffff" };
    return acc;
  }, {});

  function onDayPress(day: { dateString: string }) {
    const dateStr = day.dateString;
    setSelectedDates(prev => {
      const next = { ...prev };
      if (next[dateStr]) {
        delete next[dateStr];
      } else {
        next[dateStr] = true;
      }
      return next;
    });
  }

  function onBack() {
    // integrate with navigation if available
  }

  function blockAction() {
    // TODO: integrate with backend
    // For now, just close
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} >
      <View className="flex-1 bg-white">
        <HeaderSecondary title="Bloquear Datas" onBack={onBack} />

        <View className="px-5 mt-10">
          <Text style={{ color: "#6b7280", marginBottom: 10, textAlign: "center" }}>
            Selecione os dias em que você estará indisponível
          </Text>

          <Divider style={{ marginBottom: 20 }} />

          {/* Inline calendar card */}
          <View className="rounded-3xl border border-gray-200 p-4">
            <Calendar
              markedDates={markedDates}
              onDayPress={onDayPress}
              theme={{
                todayTextColor: "#111111",
                textSectionTitleColor: "#9ca3af",
                monthTextColor: "#111111",
                arrowColor: "#111111",
              }}
            />

            <View className="mt-4">
              <Text style={{ color: "#6b7280" }}>
                {selectedCount > 0 ? `${selectedCount} data(s) selecionada(s)` : "Nenhum dia selecionado"}
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom actions */}
        <View className="px-5 pb-6 pt-4 bg-white">
          <View className="flex-row gap-4">
            <View className="flex-1">
              <DefaultButton variant="outline">Cancelar</DefaultButton>
            </View>
            <View className="flex-1">
              <DefaultButton variant="primary" onPress={canBlock ? blockAction : undefined}>
                {canBlock ? `Bloquear (${selectedCount})` : "Bloquear"}
              </DefaultButton>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
