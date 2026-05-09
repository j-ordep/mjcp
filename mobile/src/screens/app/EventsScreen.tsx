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
import { Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import EventCard from "../../components/card/EventCard";
import HeaderSecondary from "../../components/Header/HeaderSecondary";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { useAuthStore } from "../../stores/useAuthStore";
import { useEventStore } from "../../stores/useEventStore";
import { Event } from "../../types/models";
import { formatDateTime } from "../../utils/formatDate";
import { toInformationalEventViewModel } from "../../utils/eventPresentation";
import {
  compareEventDatesByFilter,
  matchesEventTimeFilter,
} from "../../utils/eventFilters";

type Filter = "current" | "past";

export default function EventsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeFilter, setActiveFilter] = useState<Filter>("current");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { profile } = useAuthStore();
  const { allEvents, isLoadingAllEvents, fetchEvents } = useEventStore();
  const canManageEvents = profile?.role === "admin";

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      void fetchEvents(true);
    }, [fetchEvents]),
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
          showActions={false}
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
        <Text style={{ color: "#888", fontSize: 16, textAlign: "center" }}>
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
              backgroundColor: "#111827",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>
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
              backgroundColor: "#111827",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>Voltar para próximos</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }, [activeFilter, debouncedSearch, isLoadingAllEvents]);

  return (
    <SafeAreaView
      className="flex-1 bg-white"
      edges={["top", "left", "right"]}
    >
      <HeaderSecondary
        title="Eventos"
        onBack={() => navigation.goBack()}
        rightIcon={canManageEvents ? <Plus size={22} color="#000" /> : undefined}
        onRightPress={canManageEvents ? () => navigation.navigate("CreateEvent") : undefined}
      />

      <View className="px-5">
        <View
          className="flex-row items-center rounded-xl px-3 mb-4"
          style={{
            backgroundColor: "#f9fafb",
            borderWidth: 1,
            borderColor: "#e5e7eb",
          }}
        >
          <Search size={18} color="#888" />
          <TextInput
            placeholder="Buscar evento..."
            value={search}
            onChangeText={setSearch}
            style={{
              flex: 1,
              backgroundColor: "transparent",
              fontSize: 15,
              height: 44,
            }}
            underlineColor="transparent"
            activeUnderlineColor="transparent"
          />
        </View>

        <View className="flex-row gap-2 mb-4">
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              onPress={() => setActiveFilter(filter.key)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 18,
                borderRadius: 10,
                backgroundColor: activeFilter === filter.key ? "#000" : "#f3f4f6",
                borderWidth: activeFilter === filter.key ? 0 : 1,
                borderColor: "#e5e7eb",
              }}
            >
              <Text
                style={{
                  color: activeFilter === filter.key ? "#fff" : "#222",
                  fontWeight: activeFilter === filter.key ? "bold" : "normal",
                  fontSize: 14,
                }}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoadingAllEvents ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#000" />
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
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={ListEmpty}
        />
      )}
    </SafeAreaView>
  );
}

