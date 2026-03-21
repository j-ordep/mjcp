import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Search } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  View,
} from "react-native";
import { Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus } from "lucide-react-native";
import EventCard from "../../components/card/EventCard";
import HeaderSecondary from "../../components/Header/HeaderSecondary";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { useEventStore } from "../../stores/useEventStore";
import { useAuthStore } from "../../stores/useAuthStore";
import { Event } from "../../types/models";
import { formatDateTime } from "../../utils/formatDate";

type Filter = "todos" | "proximos" | "passados";

export default function EventsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeFilter, setActiveFilter] = useState<Filter>("todos");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const { events, isLoadingEvents, fetchUpcomingEvents } = useEventStore();
  const { profile } = useAuthStore();
  const isAdmin = profile?.role === 'admin';

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

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
    return events.filter((e) => {
      const eventTime = new Date(e.start_at).getTime();
      const matchesFilter =
        activeFilter === "todos" ||
        (activeFilter === "proximos" && eventTime >= now) ||
        (activeFilter === "passados" && eventTime < now);
      const matchesSearch =
        !debouncedSearch || e.title.toLowerCase().includes(debouncedSearch.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [events, activeFilter, debouncedSearch]);

  const handleLoadMore = useCallback(() => {
    // Para simplificar agora, o fetch traz tudo. Paginação real seria no Supabase.
  }, []);

  const filters: { key: Filter; label: string }[] = useMemo(
    () => [
      { key: "todos", label: "Todos" },
      { key: "proximos", label: "Próximos" },
      { key: "passados", label: "Passados" },
    ],
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: Event }) => (
      <EventCard
        title={item.title}
        date={formatDateTime(item.start_at)}
        location={item.location || ''}
        description={item.description || undefined}
        showActions={false}
        onDetails={() => navigation.navigate("EventDetails", {
          event: item
        })}
      />
    ),
    [navigation],
  );

  const keyExtractor = useCallback((item: Event) => item.id, []);

  const ListFooter = useCallback(() => null, []);

  const ListEmpty = useCallback(() => {
    if (isLoadingEvents) return null;
    return (
      <View className="items-center justify-center py-16 px-10">
        <Text style={{ color: "#888", fontSize: 16, textAlign: 'center' }}>
          Nenhum evento encontrado.
        </Text>
      </View>
    );
  }, [isLoadingEvents]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <HeaderSecondary
        title="Todos os Eventos"
        onBack={() => navigation.goBack()}
        rightIcon={isAdmin ? <Plus size={22} color="#000" /> : undefined}
        onRightPress={isAdmin ? () => navigation.navigate("CreateEvent") : undefined}
      />

      <View className="px-5">
        {/* Search */}
        <View className="flex-row items-center bg-gray-100 rounded-xl border border-gray-200 px-3 mb-4">
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

        {/* Filters */}
        <View className="flex-row gap-2 mb-4">
          {filters.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setActiveFilter(f.key)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 18,
                borderRadius: 10,
                backgroundColor: activeFilter === f.key ? "#000" : "#f3f4f6",
                borderWidth: activeFilter === f.key ? 0 : 1,
                borderColor: "#e5e7eb",
              }}
            >
              <Text
                style={{
                  color: activeFilter === f.key ? "#fff" : "#222",
                  fontWeight: activeFilter === f.key ? "bold" : "normal",
                  fontSize: 14,
                }}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoadingEvents ? (
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
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={ListFooter}
          ListEmptyComponent={ListEmpty}
        />
      )}
    </SafeAreaView>
  );
}
