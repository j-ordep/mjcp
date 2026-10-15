import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, ScrollView, TouchableOpacity, View } from "react-native";
import { Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import ScheduleSummaryCard from "../../components/schedule/ScheduleSummaryCard";
import type { RootStackParamList } from "../../types/navigation";
import { useAuthStore } from "../../stores/useAuthStore";
import { useMinistryStore } from "../../stores/useMinistryStore";
import { useScheduleStore, type ScheduleViewMode } from "../../stores/useScheduleStore";
import { formatDateTime } from "../../utils/formatDate";
import { getOwnRoleLabel, getParticipationStatusLabel } from "../../utils/scheduleParticipation";
import { compareScheduleDatesByFilter, matchesScheduleTimeFilter } from "../../utils/scheduleRules";

export default function ScheduleScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profile, session } = useAuthStore();
  const { userMinistries, userMinistriesUserId, fetchUserMinistries } = useMinistryStore();
  const { scheduleCards, isLoadingSchedules, error, fetchScheduleCards } = useScheduleStore();
  const [mode, setMode] = useState<ScheduleViewMode>("personal");
  const [timeFilter, setTimeFilter] = useState<"current" | "past">("current");
  const [search, setSearch] = useState("");
  const [ministryId, setMinistryId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingScope, setLoadingScope] = useState(false);
  const [scopeError, setScopeError] = useState<string | null>(null);
  const requestRevision = useRef(0);
  const isAdmin = profile?.role === "admin";
  const canManage = isAdmin || (userMinistriesUserId === session?.user?.id && userMinistries.some((ministry) => ministry.is_leader));
  const load = useCallback(async (refresh = false) => {
    const userId = session?.user.id;
    if (!userId) return;
    const request = ++requestRevision.current;
    const authRevision = useAuthStore.getState().sessionRevision;
    const current = () => request === requestRevision.current && authRevision === useAuthStore.getState().sessionRevision;
    setRefreshing(refresh);
    setLoadingScope(true);
    setScopeError(null);
    try {
      await fetchUserMinistries(true);
      if (!current()) return;
      const scope = useMinistryStore.getState();
      if (scope.error || scope.userMinistriesUserId !== userId) {
        setScopeError(scope.error ?? "Não foi possível confirmar seus ministérios.");
        return;
      }
      const leaderMinistryIds = scope.userMinistries.filter((ministry) => ministry.is_leader).map((ministry) => ministry.id);
      const effectiveMode = mode === "manageable" && !isAdmin && !leaderMinistryIds.length ? "personal" : mode;
      if (effectiveMode !== mode) setMode(effectiveMode);
      await fetchScheduleCards({ userId, viewMode: effectiveMode, isAdmin, leaderMinistryIds, forceRefresh: true });
    } finally {
      if (current()) { setRefreshing(false); setLoadingScope(false); }
    }
  }, [session?.user.id, mode, isAdmin, fetchUserMinistries, fetchScheduleCards]);
  useFocusEffect(useCallback(() => {
    void load();
    return () => { ++requestRevision.current; };
  }, [load]));
  const ministries = useMemo(() => Array.from(new Map(scheduleCards.map((card) => [card.ministry.id, card.ministry])).values()), [scheduleCards]);
  useEffect(() => {
    if (!loadingScope && !isLoadingSchedules && ministryId && !ministries.some((ministry) => ministry.id === ministryId)) setMinistryId(null);
  }, [loadingScope, isLoadingSchedules, ministryId, ministries]);
  const filtered = useMemo(() => scheduleCards.filter((card) =>
    matchesScheduleTimeFilter(card.event.start_at, timeFilter) && (!ministryId || card.ministry.id === ministryId) &&
    (!search.trim() || `${card.event.title} ${card.ministry.name}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
  ).sort((a, b) => compareScheduleDatesByFilter(a.event.start_at, b.event.start_at, timeFilter)), [scheduleCards, ministryId, search, timeFilter]);
  const chip = (label: string, selected: boolean, onPress: () => void, key = label) => (
    <TouchableOpacity key={key} onPress={onPress} style={{ padding: 10, borderRadius: 12, backgroundColor: selected ? "#111827" : "#f3f4f6" }}>
      <Text style={{ color: selected ? "white" : "#111827" }}>{label}</Text>
    </TouchableOpacity>
  );
  const loading = loadingScope || isLoadingSchedules;
  const loadError = scopeError || error;
  return (
    <SafeAreaView className="flex-1 bg-white" edges={["left", "right"]}>
      <View style={{ paddingHorizontal: 20, gap: 12, paddingBottom: 12 }}>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {chip("Trocas", false, () => navigation.navigate("SwapRequests"))}
          {chip("Indisponibilidades", false, () => navigation.navigate("BlockDatesScreen"))}
          {canManage ? chip("Criar escala", false, () => navigation.navigate("CreateSchedule")) : null}
        </View>
        {canManage ? <View style={{ flexDirection: "row", gap: 8 }}>
          {chip("Minhas", mode === "personal", () => setMode("personal"))}
          {chip("Gerenciadas", mode === "manageable", () => setMode("manageable"))}
        </View> : null}
        <TextInput label="Buscar escala" value={search} onChangeText={setSearch} style={{ backgroundColor: "#f3f4f6" }} />
        <View style={{ flexDirection: "row", gap: 8 }}>
          {chip("Próximas", timeFilter === "current", () => setTimeFilter("current"))}
          {chip("Anteriores", timeFilter === "past", () => setTimeFilter("past"))}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {chip("Todos os ministérios", !ministryId, () => setMinistryId(null))}
          {ministries.map((ministry) => chip(ministry.name, ministryId === ministry.id, () => setMinistryId(ministry.id), ministry.id))}
        </ScrollView>
      </View>
      {loading && !refreshing ? <ActivityIndicator style={{ margin: 24 }} /> : loadError ? <View style={{ padding: 20 }}>
        <Text>Não foi possível carregar as escalas. {loadError}</Text>
        {chip("Tentar novamente", false, () => void load())}
      </View> : <FlatList data={filtered} keyExtractor={(item) => item.id} refreshing={refreshing} onRefresh={() => void load(true)}
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        ListEmptyComponent={<Text>{search.trim() || ministryId ? "Nenhuma escala encontrada para os filtros atuais." : mode === "personal" ? "Você não possui escalas neste período." : "Nenhuma escala dos ministérios gerenciados neste período."}</Text>}
        renderItem={({ item }) => <TouchableOpacity onPress={() => navigation.navigate("EditSchedule", { scheduleId: item.id })} accessibilityRole="button" accessibilityLabel={`Abrir escala ${item.event.title}, ${item.ministry.name}`}>
          <ScheduleSummaryCard eventTitle={item.event.title} eventDate={formatDateTime(item.event.start_at)} eventLocation={item.event.location}
            ministryName={item.ministry.name} participationLabel={getParticipationStatusLabel(item.my_assignments)} roleLabel={getOwnRoleLabel(item.my_assignments)} />
        </TouchableOpacity>} />}
    </SafeAreaView>
  );
}
