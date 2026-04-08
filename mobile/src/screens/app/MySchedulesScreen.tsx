import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Plus, Search } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
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
import type { ScheduleCard } from "../../services/scheduleService";
import { useAuthStore } from "../../stores/useAuthStore";
import { useMinistryStore } from "../../stores/useMinistryStore";
import { useScheduleStore } from "../../stores/useScheduleStore";
import { formatDateTime } from "../../utils/formatDate";

type Filter = "current" | "past";

export default function MySchedulesScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeFilter, setActiveFilter] = useState<Filter>("current");
  const [search, setSearch] = useState("");

  const { profile, session } = useAuthStore();
  const { userMinistries, fetchUserMinistries, isLoadingMinistries } =
    useMinistryStore();
  const { scheduleCards, viewMode, isLoadingSchedules, fetchScheduleCards } =
    useScheduleStore();

  const isAdmin = profile?.role === "admin";
  const leaderMinistryIds = useMemo(
    () =>
      userMinistries
        .filter((ministry) => ministry.is_leader)
        .map((ministry) => ministry.id),
    [userMinistries],
  );
  const hasManageableScope = isAdmin || leaderMinistryIds.length > 0;
  const canCreate = hasManageableScope;

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const load = async () => {
        if (!session?.user?.id) return;

        await fetchUserMinistries(true);
        if (!isActive) return;

        const refreshedUserMinistries = useMinistryStore.getState().userMinistries;
        const refreshedLeaderMinistryIds = refreshedUserMinistries
          .filter((ministry) => ministry.is_leader)
          .map((ministry) => ministry.id);

        await fetchScheduleCards({
          userId: session.user.id,
          isAdmin,
          leaderMinistryIds: isAdmin ? [] : refreshedLeaderMinistryIds,
          forceRefresh: true,
        });
      };

      void load();

      return () => {
        isActive = false;
      };
    }, [fetchScheduleCards, fetchUserMinistries, isAdmin, session?.user?.id]),
  );

  const filteredSchedules = useMemo(() => {
    const now = new Date().getTime();
    const normalizedSearch = search.trim().toLowerCase();

    return scheduleCards.filter((schedule) => {
      const eventTime = new Date(schedule.event.start_at).getTime();
      const matchesFilter =
        activeFilter === "current" ? eventTime >= now : eventTime < now;
      const matchesSearch =
        !normalizedSearch ||
        schedule.event.title.toLowerCase().includes(normalizedSearch) ||
        schedule.ministry.name.toLowerCase().includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, scheduleCards, search]);

  const filters: { key: Filter; label: string }[] = useMemo(
    () => [
      { key: "current", label: "Próximas" },
      { key: "past", label: "Anteriores" },
    ],
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: ScheduleCard }) => {
      const roleLabel =
        item.my_assignments.length > 0
          ? item.my_assignments.map((assignment) => assignment.role_name).join(", ")
          : undefined;

      return (
        <EventCard
          title={item.event.title}
          date={formatDateTime(item.event.start_at)}
          location={item.event.location ?? undefined}
          description={item.event.description || undefined}
          department={item.ministry.name}
          role={roleLabel || undefined}
          showActions={viewMode === "personal"}
          onDetails={() => {
            if (item.can_manage) {
              navigation.navigate("EditSchedule", {
                scheduleId: item.id,
              });
              return;
            }

            navigation.navigate("EventDetails", {
              event: item.event as any,
            });
          }}
          onSwap={() => alert("Solicitação de troca em breve!")}
          onConfirm={() => alert("Confirmação em breve!")}
        />
      );
    },
    [navigation, viewMode],
  );

  const keyExtractor = useCallback((item: ScheduleCard) => item.id, []);

  const ListEmpty = useCallback(() => {
    if (isLoadingSchedules || isLoadingMinistries) return null;

    return (
      <View className="items-center justify-center py-16 px-10">
        <Text style={{ color: "#888", fontSize: 16, textAlign: "center" }}>
          {viewMode === "manageable"
            ? "Nenhuma escala gerenciável encontrada."
            : "Nenhuma escala pessoal encontrada."}
        </Text>
      </View>
    );
  }, [isLoadingMinistries, isLoadingSchedules, viewMode]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <HeaderSecondary
        title="Minhas Escalas"
        onBack={() => navigation.goBack()}
        rightIcon={canCreate ? <Plus size={22} color="#000" /> : undefined}
        onRightPress={() => navigation.navigate("CreateSchedule")}
      />

      <View className="px-5">
        <View className="mb-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
          <Text style={{ fontWeight: "700", color: "#111827", marginBottom: 4 }}>
            {viewMode === "manageable"
              ? "Hub operacional de escalas"
              : "Minhas participações"}
          </Text>
          <Text style={{ color: "#6b7280" }}>
            {viewMode === "manageable"
              ? "Abra uma escala para editar contexto, equipe e assignments."
              : "Acompanhe onde você está escalado e use os atalhos do seu card."}
          </Text>
        </View>

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

      {isLoadingSchedules || (profile?.role === "leader" && isLoadingMinistries) ? (
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
          ListEmptyComponent={ListEmpty}
        />
      )}
    </SafeAreaView>
  );
}
