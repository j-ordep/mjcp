import { colors } from "../../theme/colors";
import { Text } from "../../components/ui/text";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, TouchableOpacity, View } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import HeaderSecondary from "../../components/Header/HeaderSecondary";
import type { RootStackParamList } from "../../types/navigation";
import { acceptSwapRequest, cancelOwnSwapRequest, getVisibleSwapRequests, type SwapRequestReviewItem } from "../../services/scheduleService";
import { useAuthStore } from "../../stores/useAuthStore";
import { formatDateTime } from "../../utils/formatDate";
import { canActOnSwapRequest, filterSwapRequests, type SwapRequestFilter } from "../../utils/scheduleParticipation";
import { getSwapRequestStatusLabel } from "../../utils/statusLabels";

const FILTERS: { key: SwapRequestFilter; label: string }[] = [
  { key: "mine", label: "Minhas" },
  { key: "available", label: "Disponíveis" },
  { key: "history", label: "Histórico" },
];

export default function SwapRequestsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const userId = useAuthStore((state) => state.session?.user.id);
  const [filter, setFilter] = useState<SwapRequestFilter>("mine");
  const [items, setItems] = useState<SwapRequestReviewItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const revision = useRef(0);
  const focused = useRef(false);
  const focusRevision = useRef(0);
  const busy = useRef(false);
  const visibleItems = useMemo(() => filterSwapRequests(items, filter, userId), [items, filter, userId]);
  const isCurrentSession = () => focused.current && useAuthStore.getState().session?.user.id === userId;

  const loadRequests = useCallback(async (refresh = false) => {
    const request = ++revision.current;
    if (!userId) return;
    setIsLoading(!refresh);
    setIsRefreshing(refresh);
    setError(null);
    const result = await getVisibleSwapRequests();
    if (request !== revision.current || !focused.current || useAuthStore.getState().session?.user.id !== userId) return;
    if (result.error) {
      setError("Nao foi possivel carregar as trocas. Tente novamente em alguns instantes.");
    } else {
      setItems(result.data ?? []);
    }
    setIsLoading(false);
    setIsRefreshing(false);
  }, [userId]);

  useFocusEffect(useCallback(() => {
    focusRevision.current++;
    focused.current = true;
    if (!busy.current) setActingId(null);
    void loadRequests();
    return () => { focused.current = false; revision.current++; focusRevision.current++; };
  }, [loadRequests]));

  const runAction = async (item: SwapRequestReviewItem, action: "accept" | "cancel") => {
    if (busy.current || !isCurrentSession() || !canActOnSwapRequest(item)) return;
    const own = item.from_assignment?.user_id === userId;
    if (action === "cancel" ? !own : own) return;
    busy.current = true;
    const visit = focusRevision.current;
    const isCurrentAction = () => isCurrentSession() && visit === focusRevision.current;
    setActingId(item.id);
    let succeeded = false;
    try {
      const result = action === "accept" ? await acceptSwapRequest(item.id) : await cancelOwnSwapRequest(item.id);
      succeeded = !result.error;
      if (!isCurrentAction()) return;
      if (result.error) {
        Alert.alert(action === "accept" ? "Nao foi possivel aceitar" : "Nao foi possivel cancelar",
          action === "accept" ? "A troca nao foi aceita. Tente novamente em alguns instantes." : "A solicitacao de troca nao foi cancelada. Tente novamente em alguns instantes.");
        return;
      }
      await loadRequests();
      if (action === "accept" && isCurrentAction()) Alert.alert("Troca aceita", "Voce assumiu esta escala.");
    } finally {
      busy.current = false;
      if (isCurrentSession()) setActingId(null);
      // A write may commit after the new visit loaded its list; refresh without old alerts.
      if (succeeded && isCurrentSession() && visit !== focusRevision.current) await loadRequests(true);
    }
  };

  const handleAccept = (item: SwapRequestReviewItem) => {
    if (!canActOnSwapRequest(item) || busy.current) return;
    Alert.alert("Aceitar troca", "Deseja assumir esta escala? Se outra pessoa aceitar antes, esta solicitação deixará de ficar disponível.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Aceitar", onPress: () => void runAction(item, "accept") },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <HeaderSecondary title="Trocas" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }} refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={() => void loadRequests(true)} />
      }>
        <Text style={{ color: colors.mutedForeground, marginBottom: 16 }}>
          A primeira pessoa elegível que aceitar assume a escala. O líder apenas acompanha e pode agir manualmente se quiser.
        </Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
          {FILTERS.map(({ key, label }) => (
            <TouchableOpacity key={key} onPress={() => setFilter(key)} style={{ flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: filter === key ? colors.primary : colors.muted }}>
              <Text style={{ textAlign: "center", fontWeight: "700", color: filter === key ? colors.primaryForeground : colors.foreground }}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {isLoading ? <ActivityIndicator /> : error ? (
          <View><Text style={{ color: colors.destructive }}>{error}</Text>
            <TouchableOpacity onPress={() => void loadRequests()} style={{ paddingVertical: 14 }}><Text>Tentar novamente</Text></TouchableOpacity>
          </View>
        ) : visibleItems.length === 0 ? (
          <Text style={{ color: colors.mutedForeground }}>
            {filter === "mine" ? "Nenhuma solicitação própria pendente." : filter === "history" ? "Nenhuma troca encerrada disponível no histórico." : "Nenhuma troca disponível. Quando houver uma solicitação compatível com seu ministério e função, ela aparecerá aqui."}
          </Text>
        ) : visibleItems.map((item) => (
          <View key={item.id} style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 18, marginBottom: 14 }}>
            <Text style={{ fontWeight: "700", fontSize: 16, marginBottom: 8 }}>
              {filter === "history" ? "Troca encerrada" : item.from_assignment?.member_name ?? "Membro"}
            </Text>
            <Text style={{ marginBottom: 8 }}>{getSwapRequestStatusLabel(item.status)}</Text>
            <Text>Evento: {item.from_assignment?.event_title ?? "Não informado"}</Text>
            <Text>Ministério: {item.from_assignment?.ministry_name ?? "Não informado"}</Text>
            <Text>Função: {item.from_assignment?.role_name ?? "Não informada"}</Text>
            <Text>Data: {item.from_assignment ? formatDateTime(item.from_assignment.event_start_at) : "Não informada"}</Text>
            <Text>Destinatário: {item.to_user?.full_name ?? "Não informado"}</Text>
            <Text style={{ color: colors.mutedForeground, marginTop: 6 }}>Criada em: {formatDateTime(item.created_at)}</Text>
            <Text style={{ marginVertical: 12 }}>Motivo: {item.reason?.trim() || "Sem motivo informado."}</Text>
            {filter !== "history" && !canActOnSwapRequest(item) ? <Text style={{ color: colors.mutedForeground }}>Troca somente leitura no horário do evento ou depois dele.</Text> : null}
            {filter !== "history" && canActOnSwapRequest(item) ? (
              <TouchableOpacity disabled={actingId !== null} onPress={() => filter === "mine" ? void runAction(item, "cancel") : handleAccept(item)} style={{ paddingVertical: 12, borderRadius: 14, backgroundColor: filter === "mine" ? colors.destructiveMuted : colors.primary, opacity: actingId ? 0.6 : 1 }}>
                <Text style={{ textAlign: "center", fontWeight: "700", color: filter === "mine" ? colors.destructive : colors.primaryForeground }}>{filter === "mine" ? "Cancelar solicitação" : "Aceitar troca"}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
