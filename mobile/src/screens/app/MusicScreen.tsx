import {
  ArrowDown,
  ArrowUp,
  Check,
  Music,
  Search,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from "react-native";
import { Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import DefaultButton from "../../components/button/DefaultButton";
import { getSongsCatalog, getNextUpcomingEventSetlist, replaceEventSetlist } from "../../services/musicService";
import { useAuthStore } from "../../stores/useAuthStore";
import type { EventSetlistSong } from "../../services/musicService";
import type { Song, SongCategory } from "../../types/models";
import { formatDateTime } from "../../utils/formatDate";
import { canManageEvents } from "../../utils/eventPermissions";

type CategoryFilter = "todas" | SongCategory;

interface DraftSetlistSong {
  song_id: string;
  song_key: string | null;
  song: Song;
}

const CATEGORY_LABELS: Record<SongCategory, string> = {
  louvor: "Louvor",
  adoracao: "Adoração",
  infantil: "Infantil",
  outro: "Outro",
};

function mapPersistedSetlistToDraft(items: EventSetlistSong[]): DraftSetlistSong[] {
  return items.map((item) => ({
    song_id: item.song_id,
    song_key: item.song_key,
    song: item.song,
  }));
}

function SongMeta({ song }: { song: Song }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
      {song.category ? (
        <View
          style={{
            borderRadius: 999,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            paddingHorizontal: 10,
            paddingVertical: 4,
            backgroundColor: "#f9fafb",
          }}
        >
          <Text style={{ fontSize: 12, color: "#4b5563" }}>
            {CATEGORY_LABELS[song.category]}
          </Text>
        </View>
      ) : null}
      {song.key ? (
        <View
          style={{
            borderRadius: 999,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            paddingHorizontal: 10,
            paddingVertical: 4,
            backgroundColor: "#f9fafb",
          }}
        >
          <Text style={{ fontSize: 12, color: "#4b5563" }}>Tom {song.key}</Text>
        </View>
      ) : null}
      {typeof song.bpm === "number" ? (
        <View
          style={{
            borderRadius: 999,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            paddingHorizontal: 10,
            paddingVertical: 4,
            backgroundColor: "#f9fafb",
          }}
        >
          <Text style={{ fontSize: 12, color: "#4b5563" }}>{song.bpm} BPM</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function MusicScreen() {
  const { profile } = useAuthStore();
  const userCanManageEvents = canManageEvents(profile);

  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("todas");
  const [search, setSearch] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);
  const [nextEvent, setNextEvent] = useState<import("../../types/models").Event | null>(null);
  const [nextSetlistSongs, setNextSetlistSongs] = useState<EventSetlistSong[]>([]);
  const [draftSetlistSongs, setDraftSetlistSongs] = useState<DraftSetlistSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingSetlist, setIsEditingSetlist] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);

  const loadScreen = useCallback(async () => {
    setIsLoading(true);
    setScreenError(null);

    const [songsResult, nextSetlistResult] = await Promise.all([
      getSongsCatalog(),
      getNextUpcomingEventSetlist(),
    ]);

    if (songsResult.error) {
      setSongs([]);
      setScreenError(songsResult.error);
      setIsLoading(false);
      return;
    }

    if (nextSetlistResult.error) {
      setSongs(songsResult.data ?? []);
      setNextEvent(null);
      setNextSetlistSongs([]);
      setDraftSetlistSongs([]);
      setScreenError(nextSetlistResult.error);
      setIsLoading(false);
      return;
    }

    const nextEventData = nextSetlistResult.data?.event ?? null;
    const nextSongsData = nextSetlistResult.data?.songs ?? [];

    setSongs(songsResult.data ?? []);
    setNextEvent(nextEventData);
    setNextSetlistSongs(nextSongsData);
    setDraftSetlistSongs(mapPersistedSetlistToDraft(nextSongsData));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadScreen();
  }, [loadScreen]);

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
    return songs.filter((song) => {
      const matchesCategory =
        activeCategory === "todas" || song.category === activeCategory;
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        song.title.toLowerCase().includes(query) ||
        song.artist?.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, search, songs]);

  const selectedSongIds = useMemo(
    () => new Set(draftSetlistSongs.map((song) => song.song_id)),
    [draftSetlistSongs],
  );

  const beginEditing = () => {
    setDraftSetlistSongs(mapPersistedSetlistToDraft(nextSetlistSongs));
    setIsEditingSetlist(true);
  };

  const cancelEditing = () => {
    setDraftSetlistSongs(mapPersistedSetlistToDraft(nextSetlistSongs));
    setIsEditingSetlist(false);
  };

  const addSongToDraft = (song: Song) => {
    setDraftSetlistSongs((current) => {
      if (current.some((item) => item.song_id === song.id)) {
        return current;
      }

      return [
        ...current,
        {
          song_id: song.id,
          song_key: song.key ?? null,
          song,
        },
      ];
    });
  };

  const removeSongFromDraft = (songId: string) => {
    setDraftSetlistSongs((current) => current.filter((item) => item.song_id !== songId));
  };

  const moveDraftSong = (songId: string, direction: -1 | 1) => {
    setDraftSetlistSongs((current) => {
      const index = current.findIndex((item) => item.song_id === songId);

      if (index < 0) {
        return current;
      }

      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
  };

  const handleSaveSetlist = async () => {
    if (!nextEvent) {
      return;
    }

    setIsSaving(true);
    const result = await replaceEventSetlist({
      eventId: nextEvent.id,
      items: draftSetlistSongs.map((song) => ({
        song_id: song.song_id,
        song_key: song.song_key,
      })),
    });
    setIsSaving(false);

    if (result.error) {
      setScreenError(result.error);
      return;
    }

    setScreenError(null);
    setNextSetlistSongs(result.data ?? []);
    setDraftSetlistSongs(mapPersistedSetlistToDraft(result.data ?? []));
    setIsEditingSetlist(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <View className="px-5 pt-4 pb-2">
        <Text variant="headlineSmall" style={{ fontWeight: "800" }}>
          Músicas
        </Text>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        >
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

          {categories.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, marginBottom: 16 }}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.key}
                  onPress={() => setActiveCategory(category.key)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 18,
                    borderRadius: 10,
                    backgroundColor: activeCategory === category.key ? "#000" : "#f3f4f6",
                    borderWidth: activeCategory === category.key ? 0 : 1,
                    borderColor: "#e5e7eb",
                  }}
                >
                  <Text
                    style={{
                      color: activeCategory === category.key ? "#fff" : "#222",
                      fontWeight: activeCategory === category.key ? "bold" : "normal",
                      fontSize: 14,
                    }}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : null}

          {screenError ? (
            <View
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#fecaca",
                backgroundColor: "#fef2f2",
                padding: 16,
                marginBottom: 16,
              }}
            >
              <Text style={{ color: "#991b1b", lineHeight: 20 }}>{screenError}</Text>
            </View>
          ) : null}

          <View
            style={{
              backgroundColor: "#000",
              borderRadius: 20,
              padding: 18,
              marginBottom: 20,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                Próximo setlist
              </Text>
              {nextEvent ? (
                <Text style={{ color: "#9ca3af", fontSize: 12 }}>
                  {nextSetlistSongs.length} música(s)
                </Text>
              ) : null}
            </View>

            {nextEvent ? (
              <>
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "800",
                    fontSize: 18,
                    marginBottom: 4,
                  }}
                >
                  {nextEvent.title}
                </Text>
                <Text style={{ color: "#d1d5db", marginBottom: 12 }}>
                  {formatDateTime(nextEvent.start_at)}
                </Text>

                {nextSetlistSongs.length > 0 ? (
                  nextSetlistSongs.map((item) => (
                    <View
                      key={item.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 8,
                        borderTopWidth: 1,
                        borderTopColor: "#1f2937",
                      }}
                    >
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: "#111827",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 10,
                        }}
                      >
                        <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                          {item.position}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: "#fff", fontWeight: "600" }}>
                          {item.song.title}
                        </Text>
                        <Text style={{ color: "#9ca3af", fontSize: 12 }}>
                          {item.song.artist || "Sem artista"} · Tom {item.song_key || item.song.key || "-"}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={{ color: "#d1d5db", lineHeight: 20 }}>
                    Nenhuma música definida para o próximo evento ainda.
                  </Text>
                )}

                {userCanManageEvents ? (
                  <View style={{ marginTop: 14 }}>
                    {isEditingSetlist ? (
                      <DefaultButton variant="outline" onPress={cancelEditing}>
                        Cancelar edição
                      </DefaultButton>
                    ) : (
                      <DefaultButton variant="outline" onPress={beginEditing}>
                        Editar setlist
                      </DefaultButton>
                    )}
                  </View>
                ) : null}
              </>
            ) : (
              <Text style={{ color: "#d1d5db", lineHeight: 20 }}>
                Ainda não há evento futuro para montar setlist.
              </Text>
            )}
          </View>

          {isEditingSetlist && nextEvent ? (
            <View
              style={{
                borderRadius: 20,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                padding: 16,
                marginBottom: 20,
                backgroundColor: "#fff",
              }}
            >
              <Text style={{ fontWeight: "700", fontSize: 16, marginBottom: 6 }}>
                Editar setlist
              </Text>
              <Text style={{ color: "#6b7280", lineHeight: 20, marginBottom: 12 }}>
                Toque na lista abaixo para adicionar músicas. Reordene as escolhidas e salve.
              </Text>

              {draftSetlistSongs.length === 0 ? (
                <View
                  style={{
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    borderStyle: "dashed",
                    padding: 18,
                    marginBottom: 14,
                  }}
                >
                  <Text style={{ color: "#6b7280" }}>
                    Nenhuma música na setlist ainda.
                  </Text>
                </View>
              ) : (
                draftSetlistSongs.map((item, index) => (
                  <View
                    key={item.song_id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: "#e5e7eb",
                      borderRadius: 16,
                      padding: 12,
                      marginBottom: 10,
                      backgroundColor: "#fff",
                    }}
                  >
                    <View
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 15,
                        backgroundColor: "#111827",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>
                        {index + 1}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "700", fontSize: 15 }}>
                        {item.song.title}
                      </Text>
                      <Text style={{ color: "#6b7280", fontSize: 13 }}>
                        {item.song.artist || "Sem artista"} · Tom {item.song_key || item.song.key || "-"}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => moveDraftSong(item.song_id, -1)}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 17,
                          borderWidth: 1,
                          borderColor: "#e5e7eb",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ArrowUp size={16} color="#111827" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => moveDraftSong(item.song_id, 1)}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 17,
                          borderWidth: 1,
                          borderColor: "#e5e7eb",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ArrowDown size={16} color="#111827" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => removeSongFromDraft(item.song_id)}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 17,
                          borderWidth: 1,
                          borderColor: "#fecaca",
                          backgroundColor: "#fff1f2",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <X size={16} color="#be123c" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}

              <DefaultButton
                variant="primary"
                onPress={() => void handleSaveSetlist()}
                isLoading={isSaving}
              >
                Salvar setlist
              </DefaultButton>
            </View>
          ) : null}

          <Text style={{ fontWeight: "700", fontSize: 16, marginBottom: 10 }}>
            Catálogo
          </Text>

          {filteredSongs.length === 0 ? (
            <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 32 }}>
              <Text style={{ color: "#6b7280", fontSize: 15 }}>
                Nenhuma música encontrada.
              </Text>
            </View>
          ) : (
            filteredSongs.map((song) => {
              const alreadySelected = selectedSongIds.has(song.id);

              return (
                <TouchableOpacity
                  key={song.id}
                  onPress={() => {
                    if (!isEditingSetlist || alreadySelected) {
                      return;
                    }

                    addSongToDraft(song);
                  }}
                  activeOpacity={isEditingSetlist && !alreadySelected ? 0.8 : 1}
                  style={{
                    borderWidth: 1,
                    borderColor: alreadySelected ? "#d1fae5" : "#f3f4f6",
                    backgroundColor: alreadySelected ? "#ecfdf5" : "#fff",
                    borderRadius: 18,
                    padding: 14,
                    marginBottom: 12,
                    opacity: isEditingSetlist && alreadySelected ? 0.75 : 1,
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
                        backgroundColor: "#f3f4f6",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <Music size={20} color="#666" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "700", fontSize: 15 }}>{song.title}</Text>
                      <Text style={{ color: "#6b7280", fontSize: 13 }}>
                        {song.artist || "Sem artista"}
                      </Text>
                    </View>
                    {alreadySelected ? (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: "#dcfce7",
                          borderRadius: 999,
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          gap: 6,
                        }}
                      >
                        <Check size={14} color="#166534" />
                        <Text style={{ color: "#166534", fontWeight: "700", fontSize: 12 }}>
                          Na setlist
                        </Text>
                      </View>
                    ) : isEditingSetlist ? (
                      <Text style={{ color: "#111827", fontWeight: "700", fontSize: 13 }}>
                        Adicionar
                      </Text>
                    ) : null}
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
