import { colors } from "../../theme/colors";
import { Badge } from "../../components/ui/badge";
import { SelectField } from "../../components/ui/select-field";
import { Text } from "../../components/ui/text";
import { Input } from "../../components/ui/input";
import { Music, Search } from "lucide-react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import NextEventSetlistCard from "../../components/music/NextEventSetlistCard";
import type { RootStackParamList } from "../../types/navigation";
import { getSongsCatalog, getNextUpcomingEventSetlist } from "../../services/musicService";
import type { EventSetlistSong } from "../../services/musicService";
import type { Event, Song, SongCategory } from "../../types/models";

type CategoryFilter = "todas" | SongCategory;

const CATEGORY_LABELS: Record<SongCategory, string> = {
  louvor: "Louvor",
  adoracao: "Adoração",
  infantil: "Infantil",
  outro: "Outro",
};

function SongMeta({ song }: { song: Song }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
      {song.category ? <Badge>{CATEGORY_LABELS[song.category]}</Badge> : null}
      {song.key ? <Badge variant="outline">Tom {song.key}</Badge> : null}
      {typeof song.bpm === "number" ? <Badge variant="outline">{song.bpm} BPM</Badge> : null}
    </View>
  );
}

export default function MusicScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("todas");
  const [search, setSearch] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);
  const [nextEvent, setNextEvent] = useState<Event | null>(null);
  const [nextSetlistSongs, setNextSetlistSongs] = useState<EventSetlistSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);

  const revision = useRef(0);

  const loadScreen = useCallback(async (refresh = false) => {
    const request = ++revision.current;
    setIsLoading(!refresh);
    setIsRefreshing(refresh);
    const [catalog, next] = await Promise.all([getSongsCatalog(), getNextUpcomingEventSetlist()]);
    if (request !== revision.current) return;
    setSongs(catalog.data ?? []);
    setNextEvent(next.data?.event ?? null);
    setNextSetlistSongs(next.data?.songs ?? []);
    setScreenError(catalog.error ?? next.error);
    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => {
    void loadScreen();
    return () => { revision.current++; };
  }, [loadScreen]));

  const categories = useMemo(() => {
    const dynamicCategories = Array.from(
      new Set(
        songs
          .map((song) => song.category)
          .filter((category): category is SongCategory => typeof category === "string"),
      ),
    );

    return [
      { key: "todas" as const, label: "Todas" },
      ...dynamicCategories.map((category) => ({
        key: category,
        label: CATEGORY_LABELS[category],
      })),
    ];
  }, [songs]);

  const filteredSongs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return songs.filter((song) => {
      const matchesCategory =
        activeCategory === "todas" || song.category === activeCategory;
      const matchesSearch =
        !query ||
        song.title.toLowerCase().includes(query) ||
        song.artist?.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, search, songs]);

  const openSongDetails = (songId: string) => navigation.navigate("MusicDetails", { songId });

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["left", "right"]}>
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.foreground} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void loadScreen(true)}
            />
          }
        >
          <Input
              placeholder="Buscar música ou artista..."
              value={search}
              onChangeText={setSearch}
              accessibilityLabel="Buscar música ou artista"
              left={<Search size={18} color={colors.mutedForeground} />}
              fieldClassName="bg-muted border-border"
              containerStyle={{ marginBottom: 16 }}
              returnKeyType="search"
            />

          {categories.length > 1 ? (
            <SelectField label="Categoria" value={activeCategory}
              options={categories.map((category) => ({ value: category.key, label: category.label }))}
              onValueChange={(value) => setActiveCategory(value as CategoryFilter)}
              containerStyle={{ marginBottom: 16 }} />
          ) : null}

          {screenError ? (
            <View
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.destructiveBorder,
                backgroundColor: colors.destructiveMuted,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <Text style={{ color: colors.destructive, lineHeight: 20 }}>{screenError}</Text>
            </View>
          ) : null}

          <NextEventSetlistCard
            event={nextEvent}
            songs={nextSetlistSongs}
            onOpenSong={openSongDetails}
            onOpenSetlist={() => nextEvent && navigation.navigate("EventSetlist", { eventId: nextEvent.id })}
          />

          <Text style={{ fontWeight: "700", fontSize: 16, marginBottom: 10 }}>
            Catálogo
          </Text>

          {filteredSongs.length === 0 ? (
            <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 32 }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 15 }}>
                Nenhuma música encontrada.
              </Text>
            </View>
          ) : (
            filteredSongs.map((song) => {
              return (
                <TouchableOpacity
                  key={song.id}
                  onPress={() => openSongDetails(song.id)}
                  activeOpacity={0.8}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    borderRadius: 18,
                    padding: 14,
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: colors.muted,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <Music size={20} color={colors.mutedForeground} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "700", fontSize: 15 }}>{song.title}</Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
                        {song.artist || "Sem artista"}
                      </Text>
                    </View>
                  </View>
                  <SongMeta song={song} />
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
