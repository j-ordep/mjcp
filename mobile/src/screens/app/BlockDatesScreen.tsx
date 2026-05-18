import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { Divider, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderSecondary from "../../components/Header/HeaderSecondary";
import DefaultButton from "../../components/button/DefaultButton";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import {
  listBlockedDatesForUser,
  syncBlockedDatesForUser,
} from "../../services/blockedDateService";
import { useAuthStore } from "../../stores/useAuthStore";

export default function BlockDatesScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session } = useAuthStore();
  const userId = session?.user?.id ?? "";
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Record<string, true>>({});
  const [savedDates, setSavedDates] = useState<Record<string, true>>({});

  const selectedCount = Object.keys(selectedDates).length;
  const savedCount = Object.keys(savedDates).length;
  const addedCount = Object.keys(selectedDates).filter((date) => !savedDates[date]).length;
  const removedCount = Object.keys(savedDates).filter((date) => !selectedDates[date]).length;
  const hasChanges = addedCount > 0 || removedCount > 0;
  const canSave = !isLoading && hasChanges;

  useEffect(() => {
    if (!isSaving) {
      return;
    }

    const unsubscribe = navigation.addListener("beforeRemove", (event) => {
      event.preventDefault();
    });

    return unsubscribe;
  }, [isSaving, navigation]);

  const loadBlockedDates = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      Alert.alert("Sessao expirada", "Entre novamente para gerenciar suas datas bloqueadas.", [
        { text: "Voltar", onPress: () => navigation.goBack() },
      ]);
      return;
    }

    setIsLoading(true);
    const result = await listBlockedDatesForUser(userId);
    setIsLoading(false);

    if (result.error) {
      Alert.alert("Nao foi possivel carregar", result.error, [
        { text: "Voltar", onPress: () => navigation.goBack() },
      ]);
      return;
    }

    const nextDates = (result.data ?? []).reduce<Record<string, true>>(
      (acc, blockedDate) => {
        acc[blockedDate.date] = true;
        return acc;
      },
      {},
    );

    setSelectedDates(nextDates);
    setSavedDates(nextDates);
  }, [navigation, userId]);

  useEffect(() => {
    void loadBlockedDates();
  }, [loadBlockedDates]);

  const markedDates = useMemo(
    () =>
      Object.keys(selectedDates).reduce<Record<string, any>>((acc, key) => {
        acc[key] = {
          selected: true,
          selectedColor: savedDates[key] ? "#111111" : "#374151",
          selectedTextColor: "#ffffff",
        };
        return acc;
      }, {}),
    [savedDates, selectedDates],
  );

  function onDayPress(day: { dateString: string }) {
    if (isSaving) {
      return;
    }

    const dateStr = day.dateString;
    setSelectedDates((prev) => {
      const next = { ...prev };
      if (next[dateStr]) {
        delete next[dateStr];
      } else {
        next[dateStr] = true;
      }
      return next;
    });
  }

  function handleBack() {
    if (isSaving) {
      return;
    }

    navigation.goBack();
  }

  async function blockAction() {
    if (!userId) {
      Alert.alert("Sessao expirada", "Entre novamente para salvar suas datas bloqueadas.");
      return;
    }

    setIsSaving(true);
    const result = await syncBlockedDatesForUser(userId, Object.keys(selectedDates));
    setIsSaving(false);

    if (result.error) {
      Alert.alert("Nao foi possivel salvar", result.error);
      return;
    }

    setSavedDates({ ...selectedDates });
    navigation.goBack();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View className="flex-1 bg-white">
        <HeaderSecondary title="Bloquear Datas" onBack={handleBack} />

        <View className="px-5 mt-10">
          <Text
            style={{ color: "#6b7280", marginBottom: 10, textAlign: "center" }}
          >
            Selecione os dias em que voce estara indisponivel
          </Text>

          <Divider style={{ marginBottom: 20 }} />

          <View
            className="rounded-3xl border border-gray-200 p-4"
            pointerEvents={isSaving ? "none" : "auto"}
          >
            {isLoading ? (
              <View className="items-center py-10">
                <ActivityIndicator color="#111111" />
                <Text style={{ color: "#6b7280", marginTop: 12 }}>
                  Carregando datas bloqueadas...
                </Text>
              </View>
            ) : (
              <>
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

                <View className="mt-4 gap-2">
                  <Text style={{ color: "#6b7280" }}>
                    {selectedCount > 0
                      ? `${selectedCount} data(s) bloqueada(s)`
                      : "Nenhuma data bloqueada"}
                  </Text>
                  <Text style={{ color: "#6b7280" }}>
                    {hasChanges
                      ? `Alteracoes pendentes: ${addedCount} nova(s), ${removedCount} removida(s)`
                      : `${savedCount} data(s) salva(s) no seu calendario`}
                  </Text>
                  <Text style={{ color: "#9ca3af", fontSize: 12 }}>
                    Datas bloqueadas continuam sendo aviso soft na escala; o lider ainda pode escalar mesmo assim.
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        <View className="px-5 pb-6 pt-4 bg-white">
          <View className="flex-row gap-4">
            <View className="flex-1">
              <DefaultButton
                variant="outline"
                onPress={handleBack}
                disabled={isSaving}
              >
                Cancelar
              </DefaultButton>
            </View>
            <View className="flex-1">
              <DefaultButton
                variant="primary"
                onPress={canSave ? () => void blockAction() : undefined}
                isLoading={isSaving}
                disabled={!canSave}
              >
                {hasChanges ? "Salvar alteracoes" : "Sem alteracoes"}
              </DefaultButton>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
