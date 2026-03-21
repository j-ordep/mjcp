import { useNavigation } from "@react-navigation/native";
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
import { UpcomingSchedule } from "../../services/scheduleService";
import { useAuthStore } from "../../stores/useAuthStore";
import { useMinistryStore } from "../../stores/useMinistryStore";
import { useScheduleStore } from "../../stores/useScheduleStore";
import { formatDateTime } from "../../utils/formatDate";

type Filter = "current" | "past";

const PAGE_SIZE = 10;

export default function MySchedulesScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeFilter, setActiveFilter] = useState<Filter>("current");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { mySchedules, isLoadingSchedules, fetchMySchedules } =
    useScheduleStore();
  const { profile, session } = useAuthStore();
  const { userMinistries, fetchUserMinistries } = useMinistryStore();

  const isAdmin = profile?.role === "admin";
  const isLeader = userMinistries.some((m) => m.is_leader);
  const canCreate = isAdmin || isLeader;

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetchMySchedules(session.user.id, isAdmin);
    }
    fetchUserMinistries();
  }, [session?.user?.id]);

  const filteredSchedules = useMemo(() => {
    const now = new Date().getTime();
    return mySchedules.filter((s) => {
      const eventTime = new Date(s.event.start_at).getTime();
      const matchesFilter =
        activeFilter === "current" ? eventTime >= now : eventTime < now;
      const matchesSearch =
        !debouncedSearch ||
        s.event.title.toLowerCase().includes(debouncedSearch.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [mySchedules, activeFilter, debouncedSearch]);

  const handleLoadMore = useCallback(() => {
    // Para simplificar agora, o fetch traz tudo. Paginação real seria no Supabase.
  }, []);

  const filters: { key: Filter; label: string }[] = useMemo(
    () => [
      { key: "current", label: "Próximas" },
      { key: "past", label: "Anteriores" },
    ],
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: UpcomingSchedule }) => (
      <EventCard
        title={item.event.title}
        date={formatDateTime(item.event.start_at)}
        location={item.event.location ?? undefined}
        description={item.event.description || undefined}
        role={item.role_name}
        showActions={true}
        onDetails={() =>
          navigation.navigate("EventDetails", {
            event: item.event as any,
          })
        }
        // TODO: integrar com scheduleService.requestSwap(item.id)
        onSwap={() => alert("Solicitação de troca em breve!")}
        // TODO: integrar com scheduleService.confirmPresence(item.id)
        onConfirm={() => alert("Confirmação em breve!")}
      />
    ),
    [navigation],
  );

  const keyExtractor = useCallback((item: UpcomingSchedule) => item.id, []);

  const ListFooter = useCallback(() => null, []);

  const ListEmpty = useCallback(() => {
    if (isLoadingSchedules) return null;
    return (
      <View className="items-center justify-center py-16 px-10">
        <Text style={{ color: "#888", fontSize: 16, textAlign: "center" }}>
          Nenhuma escala encontrada.
        </Text>
      </View>
    );
  }, [isLoadingSchedules]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <HeaderSecondary
        title="Minhas Escalas"
        onBack={() => navigation.goBack()}
        rightIcon={canCreate ? <Plus size={22} color="#000" /> : undefined}
        onRightPress={() => navigation.navigate("CreateSchedule")}
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

      {isLoadingSchedules ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <FlatList
          data={filteredSchedules}
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
