import { colors } from "../../theme/colors";
import { Text } from "../../components/ui/text";
import { Input } from "../../components/ui/input";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Plus, Search } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import EventCard from "../../components/card/EventCard";
import HeaderSecondary from "../../components/Header/HeaderSecondary";
import { RootStackParamList } from "../../types/navigation";
import { useAuthStore } from "../../stores/useAuthStore";
import { useEventStore } from "../../stores/useEventStore";
import { Event } from "../../types/models";
import { canManageEvents as canManageEventsForProfile } from "../../utils/eventPermissions";
import { formatDateTime } from "../../utils/formatDate";
import { toInformationalEventViewModel } from "../../utils/eventPresentation";
import {
  compareEventDatesByFilter,
  matchesEventTimeFilter,
} from "../../utils/eventFilters";

type Filter = "current" | "past";

function pluralizeEvents(count: number) {
  return `${count} ${count === 1 ? "evento" : "eventos"}`;
}

export default function EventsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeFilter, setActiveFilter] = useState<Filter>("current");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { profile } = useAuthStore();
  const { allEvents, isLoadingAllEvents, fetchEvents } = useEventStore();
  const canManageEvents = canManageEventsForProfile(profile);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshEvents = useCallback(async (withRefreshIndicator = false) => {
    if (withRefreshIndicator) {
      setIsRefreshing(true);
    }

    try {
      await fetchEvents(true);
    } finally {
      if (withRefreshIndicator) {
        setIsRefreshing(false);
      }
    }
  }, [fetchEvents]);

  useFocusEffect(
    useCallback(() => {
      void refreshEvents(false);
    }, [refreshEvents]),
  );

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [search]);

  const filteredEvents = useMemo(() => {
    const now = new Date().getTime();
    const normalizedSearch = debouncedSearch.trim().toLowerCase();

    return allEvents
      .filter((event) => {
        const matchesFilter = matchesEventTimeFilter(event, activeFilter, now);
        const matchesSearch =
          !normalizedSearch ||
          event.title.toLowerCase().includes(normalizedSearch);

        return matchesFilter && matchesSearch;
      })
      .sort((left, right) =>
        compareEventDatesByFilter(left, right, activeFilter),
      );
  }, [activeFilter, allEvents, debouncedSearch]);

  const filters: { key: Filter; label: string }[] = useMemo(
    () => [
      { key: "current", label: "Próximos" },
      { key: "past", label: "Anteriores" },
    ],
    [],
  );
  const resultsSummaryLabel = useMemo(() => {
    const normalizedSearch = debouncedSearch.trim();

    if (normalizedSearch) {
      return `${pluralizeEvents(filteredEvents.length)} para "${normalizedSearch}"`;
    }

    return `${pluralizeEvents(filteredEvents.length)} • ${
      activeFilter === "past" ? "Anteriores" : "Próximos"
    }`;
  }, [activeFilter, debouncedSearch, filteredEvents.length]);

  const renderItem = useCallback(
    ({ item }: { item: Event }) => {
      const viewModel = toInformationalEventViewModel(item);

      return (
        <EventCard
          title={viewModel.title}
          date={formatDateTime(viewModel.startAt)}
          category={viewModel.category}
          startAt={viewModel.startAt}
          endAt={viewModel.endAt}
          location={viewModel.location}
          description={viewModel.description}
          onDetails={() =>
            navigation.navigate("EventDetails", {
              event: item,
            })
          }
        />
      );
    },
    [navigation],
  );

  const keyExtractor = useCallback((item: Event) => item.id, []);

  const ListEmpty = useCallback(() => {
    if (isLoadingAllEvents) return null;

    const hasSearch = debouncedSearch.trim().length > 0;
    const emptyMessage = hasSearch
      ? "Nenhum evento encontrado para a busca atual."
      : activeFilter === "past"
        ? "Nenhum evento anterior encontrado."
        : "Nenhum próximo evento encontrado.";

    return (
      <View className="items-center justify-center py-16 px-10">
        <Text style={{ color: colors.mutedForeground, fontSize: 16, textAlign: "center" }}>
          {emptyMessage}
        </Text>
        {hasSearch ? (
          <TouchableOpacity
            onPress={() => {
              setSearch("");
              setActiveFilter("current");
            }}
            style={{
              marginTop: 14,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 999,
              backgroundColor: colors.primary,
            }}
          >
            <Text style={{ color: colors.primaryForeground, fontWeight: "700" }}>
              Limpar busca e voltar para próximos
            </Text>
          </TouchableOpacity>
        ) : activeFilter === "past" ? (
          <TouchableOpacity
            onPress={() => setActiveFilter("current")}
            style={{
              marginTop: 14,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 999,
              backgroundColor: colors.primary,
            }}
          >
            <Text style={{ color: colors.primaryForeground, fontWeight: "700" }}>Voltar para próximos</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }, [activeFilter, debouncedSearch, isLoadingAllEvents]);

  const isInitialLoading = isLoadingAllEvents && allEvents.length === 0;

  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={["top", "left", "right"]}
    >
      <HeaderSecondary
        title="Eventos"
        onBack={() => navigation.goBack()}
        rightIcon={canManageEvents ? <Plus size={22} color={colors.foreground} /> : undefined}
        onRightPress={canManageEvents ? () => navigation.navigate("CreateEvent") : undefined}
      />

      <View className="px-5">
          <Input
            placeholder="Buscar evento..."
            value={search}
            onChangeText={setSearch}
            accessibilityLabel="Buscar evento"
            left={<Search size={18} color={colors.mutedForeground} />}
            fieldClassName="bg-muted border-border"
            containerStyle={{ marginBottom: 16 }}
            returnKeyType="search"
          />

        <View className="flex-row gap-2 mb-4">
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              onPress={() => setActiveFilter(filter.key)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 18,
                borderRadius: 12,
                minHeight: 44,
                justifyContent: "center",
                backgroundColor: activeFilter === filter.key ? colors.primary : colors.muted,
                borderWidth: activeFilter === filter.key ? 0 : 1,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  color: activeFilter === filter.key ? colors.primaryForeground : colors.foreground,
                  fontWeight: activeFilter === filter.key ? "bold" : "normal",
                  fontSize: 14,
                }}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text
          style={{
            color: colors.mutedForeground,
            fontSize: 13,
            marginBottom: 14,
          }}
        >
          {resultsSummaryLabel}
        </Text>
      </View>

      {isInitialLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.foreground} />
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 32,
            paddingTop: 4,
          }}
          refreshing={isRefreshing}
          onRefresh={() => void refreshEvents(true)}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={ListEmpty}
        />
      )}
    </SafeAreaView>
  );
}
