import { ChevronRight, Music, Play, Search } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

type Category = "todas" | "louvor" | "adoracao" | "infantil";

const songs = [
  {
    id: 1,
    title: "Grande é o Senhor",
    artist: "Adhemar de Campos",
    tom: "G",
    bpm: 72,
    category: "adoracao",
    lastPlayed: "24/11/2025",
  },
  {
    id: 2,
    title: "Lugar Secreto",
    artist: "Gabriela Rocha",
    tom: "C",
    bpm: 68,
    category: "adoracao",
    lastPlayed: "24/11/2025",
  },
  {
    id: 3,
    title: "Goodness of God",
    artist: "Bethel Music",
    tom: "A",
    bpm: 63,
    category: "adoracao",
    lastPlayed: "17/11/2025",
  },
  {
    id: 4,
    title: "Vim Para Adorar-Te",
    artist: "Ana Paula Valadão",
    tom: "D",
    bpm: 78,
    category: "louvor",
    lastPlayed: "17/11/2025",
  },
  {
    id: 5,
    title: "Reckless Love",
    artist: "Cory Asbury",
    tom: "Bb",
    bpm: 88,
    category: "louvor",
    lastPlayed: "10/11/2025",
  },
  {
    id: 6,
    title: "Way Maker",
    artist: "Sinach",
    tom: "E",
    bpm: 68,
    category: "louvor",
    lastPlayed: "10/11/2025",
  },
  {
    id: 7,
    title: "Deus Cuida de Mim",
    artist: "Kleber Lucas",
    tom: "G",
    bpm: 80,
    category: "infantil",
    lastPlayed: "03/11/2025",
  },
  {
    id: 8,
    title: "Oceanos",
    artist: "Hillsong United",
    tom: "D",
    bpm: 66,
    category: "adoracao",
    lastPlayed: "03/11/2025",
  },
];

const nextSetlist = {
  eventTitle: "Culto de Celebração",
  date: "27/11/2025",
  songs: ["Grande é o Senhor", "Lugar Secreto", "Goodness of God", "Way Maker"],
};

export default function MusicScreen() {
  const [activeCategory, setActiveCategory] = useState<Category>("todas");
  const [search, setSearch] = useState("");

  const categories: { key: Category; label: string }[] = [
    { key: "todas", label: "Todas" },
    { key: "louvor", label: "Louvor" },
    { key: "adoracao", label: "Adoração" },
    { key: "infantil", label: "Infantil" },
  ];

  const filtered = songs.filter((s) => {
    const matchesCat =
      activeCategory === "todas" || s.category === activeCategory;
    const matchesSearch =
      !search ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.artist.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      {/* Header */}
      <View className="px-5 pt-4 pb-2">
        <Text variant="headlineSmall" style={{ fontWeight: "800" }}>
          Músicas
        </Text>
      </View>

      <View className="px-5">
        {/* Search */}
        <View className="flex-row items-center bg-gray-100 rounded-xl border border-gray-200 px-3 mb-4">
          <Search size={18} color="#888" />
          <TextInput
            placeholder="Buscar música ou artista..."
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

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, marginBottom: 16 }}
        >
          {categories.map((c) => (
            <TouchableOpacity
              key={c.key}
              onPress={() => setActiveCategory(c.key)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 18,
                borderRadius: 10,
                backgroundColor: activeCategory === c.key ? "#000" : "#f3f4f6",
                borderWidth: activeCategory === c.key ? 0 : 1,
                borderColor: "#e5e7eb",
              }}
            >
              <Text
                style={{
                  color: activeCategory === c.key ? "#fff" : "#222",
                  fontWeight: activeCategory === c.key ? "bold" : "normal",
                  fontSize: 14,
                }}
              >
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Next Setlist Card */}
        {activeCategory === "todas" && !search && (
          <TouchableOpacity
            onPress={() => alert("Ver setlist completa")}
            style={{
              backgroundColor: "#000",
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2">
                <Play size={16} color="#ffae00" fill="#ffae00" />
                <Text
                  style={{ color: "#ffae00", fontWeight: "bold", fontSize: 13 }}
                >
                  PRÓXIMO SETLIST
                </Text>
              </View>
              <ChevronRight size={18} color="#fff" />
            </View>
            <Text
              style={{
                color: "#fff",
                fontWeight: "bold",
                fontSize: 16,
                marginBottom: 4,
              }}
            >
              {nextSetlist.eventTitle}
            </Text>
            <Text style={{ color: "#9ca3af", fontSize: 13, marginBottom: 8 }}>
              {nextSetlist.date} · {nextSetlist.songs.length} músicas
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {nextSetlist.songs.map((song) => (
                <View
                  key={song}
                  style={{
                    backgroundColor: "#1f2937",
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}
                >
                  <Text style={{ color: "#d1d5db", fontSize: 12 }}>{song}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        )}

        {/* Song List */}
        {filtered.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Text style={{ color: "#888", fontSize: 16 }}>
              Nenhuma música encontrada
            </Text>
          </View>
        ) : (
          filtered.map((song) => (
            <TouchableOpacity
              key={song.id}
              onPress={() => alert(`Abrir cifra: ${song.title}`)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#f3f4f6",
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: "#f3f4f6",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Music size={20} color="#666" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "bold", fontSize: 15 }}>
                  {song.title}
                </Text>
                <Text style={{ color: "#888", fontSize: 13 }}>
                  {song.artist}
                </Text>
              </View>
              <View className="items-end">
                <View
                  style={{
                    backgroundColor: "#f3f4f6",
                    borderRadius: 6,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    marginBottom: 2,
                  }}
                >
                  <Text
                    style={{ fontWeight: "bold", fontSize: 13, color: "#222" }}
                  >
                    {song.tom}
                  </Text>
                </View>
                <Text style={{ color: "#aaa", fontSize: 11 }}>
                  {song.bpm} BPM
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
