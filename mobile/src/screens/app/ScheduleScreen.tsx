import { colors } from "../../theme/colors";
import { Text } from "../../components/ui/text";
import { Input } from "../../components/ui/input";
import { Plus, Search } from "lucide-react-native";
import { Button } from "../../components/ui/button";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, TouchableOpacity, View } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import ScheduleListCard from "../../components/schedule/ScheduleListCard";
import ScheduleActions from "../../components/schedule/ScheduleActions";
import ScheduleMinistryFilter from "../../components/schedule/ScheduleMinistryFilter";
import type { RootStackParamList } from "../../types/navigation";
import { useAuthStore } from "../../stores/useAuthStore";
import { useMinistryStore } from "../../stores/useMinistryStore";
import { useScheduleStore, type ScheduleViewMode } from "../../stores/useScheduleStore";
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
  const loading = loadingScope || isLoadingSchedules;
  const loadError = scopeError || error;
  const selectedMinistry = ministries.find((ministry) => ministry.id === ministryId);
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["left", "right"]}>
      <View className="gap-4 bg-card px-5 pb-3">
        {canManage ? (
          <View className="flex-row gap-6 border-b border-border">
            {([
              { value: "personal", label: "Minhas" },
              { value: "manageable", label: "Gerenciadas" },
            ] as const).map((option) => (
              <TouchableOpacity key={option.value} onPress={() => setMode(option.value)}
                accessibilityRole="tab" accessibilityState={{ selected: mode === option.value }}
                className={mode === option.value ? "min-h-11 justify-center border-b-2 border-primary pb-2" : "min-h-11 justify-center border-b-2 border-transparent pb-2"}>
                <Text className={mode === option.value ? "text-sm font-semibold text-foreground" : "text-sm font-medium text-muted-foreground"}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
        <ScheduleActions
          onOpenSwaps={() => navigation.navigate("SwapRequests")}
          onOpenBlockedDates={() => navigation.navigate("BlockDatesScreen")}
        />
        <View className="flex-row items-center gap-2">
          <Input placeholder="Buscar escalas" accessibilityLabel="Buscar escalas"
            value={search} onChangeText={setSearch} returnKeyType="search"
            containerStyle={{ flex: 1 }} left={<Search size={18} color={colors.mutedForeground} />}
            fieldClassName="border-border bg-muted" />
          <ScheduleMinistryFilter ministries={ministries} selectedId={ministryId} onSelect={setMinistryId} />
        </View>
        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-row gap-1">
            {([
              { value: "current", label: "Próximas" },
              { value: "past", label: "Anteriores" },
            ] as const).map((option) => (
              <TouchableOpacity key={option.value} onPress={() => setTimeFilter(option.value)}
                accessibilityRole="button" accessibilityState={{ selected: timeFilter === option.value }}
                className={timeFilter === option.value ? "min-h-11 justify-center rounded-lg bg-secondary px-3" : "min-h-11 justify-center rounded-lg px-3"}>
                <Text className={timeFilter === option.value ? "text-xs font-semibold text-foreground" : "text-xs font-medium text-muted-foreground"}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text numberOfLines={1} className="min-w-0 shrink text-right text-xs text-muted-foreground">
            {selectedMinistry?.name ?? "Todos os ministérios"}
          </Text>
        </View>
      </View>
      {loading && !refreshing ? <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.foreground} />
      </View> : loadError ? <View className="flex-1 bg-background p-5">
        <Text className="text-sm text-muted-foreground">Não foi possível carregar as escalas. {loadError}</Text>
        <TouchableOpacity accessibilityRole="button" onPress={() => void load()} className="min-h-11 justify-center self-start py-3">
          <Text className="font-semibold text-foreground">Tentar novamente</Text>
        </TouchableOpacity>
      </View> : <FlatList data={filtered} keyExtractor={(item) => item.id} refreshing={refreshing} onRefresh={() => void load(true)}
        className="flex-1 bg-background" keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
        contentContainerStyle={{ padding: 20, paddingTop: 16, paddingBottom: 24 }}
        ListHeaderComponent={filtered.length ? <Text className="mb-3 text-sm font-semibold text-muted-foreground">{timeFilter === "current" ? "Próxima escala" : "Histórico"}</Text> : null}
        ListEmptyComponent={<Text className="py-6 text-center text-sm text-muted-foreground">{search.trim() || ministryId ? "Nenhuma escala encontrada para os filtros atuais." : mode === "personal" ? "Você não possui escalas neste período." : "Nenhuma escala dos ministérios gerenciados neste período."}</Text>}
        renderItem={({ item, index }) => <View>
          {index === 1 && timeFilter === "current" ? <Text className="mb-3 mt-1 text-sm font-semibold text-muted-foreground">Na sequência</Text> : null}
          <ScheduleListCard eventTitle={item.event.title} startAt={item.event.start_at}
            eventLocation={item.event.location} ministryName={item.ministry.name}
            participationLabel={getParticipationStatusLabel(item.my_assignments)}
            roleLabel={getOwnRoleLabel(item.my_assignments)} featured={index === 0 && timeFilter === "current"}
            onPress={() => navigation.navigate("EditSchedule", { scheduleId: item.id })} />
        </View>} />}
      {canManage ? <View className="bg-card px-5 pb-3 pt-3">
        <Button accessibilityLabel="Criar escala" onPress={() => navigation.navigate("CreateSchedule")}
          className="h-auto min-h-12 rounded-xl bg-primary active:bg-primary-pressed">
          <Plus size={18} color={colors.primaryForeground} />
          <Text className="shrink text-sm font-semibold text-primary-foreground">Criar escala</Text>
        </Button>
      </View> : null}
    </SafeAreaView>
  );
}
