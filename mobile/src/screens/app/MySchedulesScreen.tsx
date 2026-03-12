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
import EventCard from "../../components/card/EventCard";
import HeaderSecondary from "../../components/Header/HeaderSecondary";
import { RootStackParamList } from "../../navigation/AppNavigator";

type Filter = "current" | "past";

interface Schedule {
  id: number;
  title: string;
  date: string;
  location: string;
  department: string;
  role: string;
  isPast: boolean;
}

// Mock: escalas do usuário
const allMockSchedules: Schedule[] = Array.from({ length: 40 }, (_, i) => {
  const templates = [
    {
      title: "Ensaio da Banda",
      location: "Sala de Ensaio 1",
      department: "Louvor",
      role: "Cantor",
    },
    {
      title: "Culto de Celebração",
      location: "Templo Principal",
      department: "Ministério de Música",
      role: "Tecladista",
    },
    {
      title: "Culto de Jovens",
      location: "Templo Principal",
      department: "Ministério Jovem",
      role: "Backing Vocal",
    },
    {
      title: "Ensaio Geral",
      location: "Sala de Ensaio 2",
      department: "Louvor",
      role: "Guitarrista",
    },
    {
      title: "Culto Domingo",
      location: "Templo Principal",
      department: "Ministério de Música",
      role: "Baixista",
    },
  ];
  const t = templates[i % templates.length];
  
  // Create a mix of past and future dates for testing
  const isPast = i % 3 === 0; // 1 in 3 events are in the past
  const month = isPast ? 10 : 12; // Outubro para passados, Dezembro para futuros
  const day = (i % 28) + 1;
  const year = 2025;
  
  return {
    id: i + 1,
    title: t.title,
    date: `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year} 19:00`,
    location: t.location,
    department: t.department,
    role: t.role,
    isPast,
  };
});

const PAGE_SIZE = 10;

function fetchSchedules(
  page: number,
  search: string,
  filter: Filter,
): Promise<{ data: Schedule[]; hasMore: boolean }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const filtered = allMockSchedules.filter((e) => {
        const matchesSearch = !search || e.title.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === "current" ? !e.isPast : e.isPast;
        
        return matchesSearch && matchesFilter;
      });
      const start = page * PAGE_SIZE;
      const data = filtered.slice(start, start + PAGE_SIZE);
      resolve({ data, hasMore: start + PAGE_SIZE < filtered.length });
    }, 400);
  });
}

export default function MySchedulesScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeFilter, setActiveFilter] = useState<Filter>("current");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [search]);

  useEffect(() => {
    setSchedules([]);
    setPage(0);
    setHasMore(true);
    loadPage(0, debouncedSearch, activeFilter, true);
  }, [debouncedSearch, activeFilter]);

  async function loadPage(p: number, searchTerm: string, filter: Filter, isReset: boolean) {
    if (isReset) setLoading(true);
    else setLoadingMore(true);

    const result = await fetchSchedules(p, searchTerm, filter);

    setSchedules((prev) =>
      isReset ? result.data : [...prev, ...result.data],
    );
    setHasMore(result.hasMore);
    setPage(p);

    if (isReset) setLoading(false);
    else setLoadingMore(false);
  }

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore || loading) return;
    loadPage(page + 1, debouncedSearch, activeFilter, false);
  }, [loadingMore, hasMore, loading, page, debouncedSearch, activeFilter]);

  const filters: { key: Filter; label: string }[] = useMemo(
    () => [
      { key: "current", label: "Deste Mês" },
      { key: "past", label: "Anteriores" },
    ],
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: Schedule }) => (
      <EventCard
        title={item.title}
        date={item.date}
        location={item.location}
        department={item.department}
        role={item.role}
        onDetails={() => navigation.navigate("EventDetails")}
        onSwap={() => alert("Solicitação de troca enviada!")}
        onConfirm={() => alert("Presença confirmada!")}
      />
    ),
    [navigation],
  );

  const keyExtractor = useCallback((item: Schedule) => String(item.id), []);

  const ListFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View className="items-center py-4">
        <ActivityIndicator size="small" color="#000" />
      </View>
    );
  }, [loadingMore]);

  const ListEmpty = useCallback(() => {
    if (loading) return null;
    return (
      <View className="items-center justify-center py-16">
        <Text style={{ color: "#888", fontSize: 16 }}>
          Nenhuma escala encontrada
        </Text>
      </View>
    );
  }, [loading]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <HeaderSecondary
        title="Minhas Escalas"
        onBack={() => navigation.goBack()}
      />

      <View className="px-5">
        {/* Search */}
        <View className="flex-row items-center bg-gray-100 rounded-xl border border-gray-200 px-3 mb-4">
          <Search size={18} color="#888" />
          <TextInput
            placeholder="Buscar escala..."
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

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <FlatList
          data={schedules}
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
          initialNumToRender={PAGE_SIZE}
          maxToRenderPerBatch={PAGE_SIZE}
          windowSize={5}
        />
      )}
    </SafeAreaView>
  );
}
