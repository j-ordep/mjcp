import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Search } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import EventCard from "../../components/card/EventCard";
import HeaderSecondary from "../../components/Header/HeaderSecondary";
import { RootStackParamList } from "../../navigation/AppNavigator";

type Filter = "todos" | "proximos" | "passados";

const events = [
  {
    id: 1,
    title: "Culto de Celebração",
    date: "27/11/2025 19:00",
    location: "Templo Principal",
    department: "Ministério de Música",
    role: "Tecladista",
    past: false,
  },
  {
    id: 2,
    title: "Ensaio da Banda",
    date: "25/11/2025 18:00",
    location: "Sala de Ensaio 1",
    department: "Louvor",
    role: "Cantor",
    past: false,
  },
  {
    id: 3,
    title: "Reunião de Obreiros",
    date: "26/11/2025 19:00",
    location: "Auditório",
    department: "Liderança",
    role: "Músico",
    past: false,
  },
  {
    id: 4,
    title: "Culto de Jovens",
    date: "29/11/2025 20:00",
    location: "Templo Principal",
    department: "Ministério Jovem",
    role: "Backing Vocal",
    past: false,
  },
  {
    id: 5,
    title: "Culto Domingo",
    date: "17/11/2025 10:00",
    location: "Templo Principal",
    department: "Ministério de Música",
    role: "Tecladista",
    past: true,
  },
  {
    id: 6,
    title: "Ensaio Geral",
    date: "15/11/2025 18:00",
    location: "Sala de Ensaio 2",
    department: "Louvor",
    role: "Guitarrista",
    past: true,
  },
];

export default function EventsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeFilter, setActiveFilter] = useState<Filter>("todos");
  const [search, setSearch] = useState("");

  const filters: { key: Filter; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "proximos", label: "Próximos" },
    { key: "passados", label: "Passados" },
  ];

  const filtered = events.filter((e) => {
    const matchesFilter =
      activeFilter === "todos" ||
      (activeFilter === "proximos" && !e.past) ||
      (activeFilter === "passados" && e.past);
    const matchesSearch =
      !search || e.title.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <HeaderSecondary
        title="Todos os Eventos"
        onBack={() => navigation.goBack()}
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

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Text style={{ color: "#888", fontSize: 16 }}>
              Nenhum evento encontrado
            </Text>
          </View>
        ) : (
          filtered.map((event) => (
            <EventCard
              key={event.id}
              title={event.title}
              date={event.date}
              location={event.location}
              department={event.department}
              role={event.role}
              onDetails={() => navigation.navigate("EventDetails")}
              onSwap={() => alert("Solicitação de troca enviada!")}
              onConfirm={() => alert("Presença confirmada!")}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
