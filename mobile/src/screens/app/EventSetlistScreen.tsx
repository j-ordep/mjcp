import { Text } from "../../components/ui/text";
import { Input } from "../../components/ui/input";
import { useFocusEffect, useNavigation, usePreventRemove, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, TouchableOpacity, View } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import DefaultButton from "../../components/button/DefaultButton";
import HeaderSecondary from "../../components/Header/HeaderSecondary";
import SetlistEditor, { type DraftSetlistSong } from "../../components/music/SetlistEditor";
import { getEventById } from "../../services/eventService";
import { getEventSetlist, getSongsCatalog, replaceEventSetlist, type EventSetlistSong } from "../../services/musicService";
import { useAuthStore } from "../../stores/useAuthStore";
import type { Event, Song } from "../../types/models";
import type { RootStackParamList } from "../../types/navigation";
import { canManageEvents } from "../../utils/eventPermissions";
import { formatDateTime } from "../../utils/formatDate";
import { isEventDateEditable } from "../../utils/scheduleRules";

function toDraft(items: EventSetlistSong[]): DraftSetlistSong[] {
  return items.map(({ song_id, song_key, song }) => ({ song_id, song_key, song }));
}

function signature(items: DraftSetlistSong[]) {
  return JSON.stringify(items.map(({ song_id, song_key }) => [song_id, song_key]));
}

export default function EventSetlistScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params: { eventId } } = useRoute<RouteProp<RootStackParamList, "EventSetlist">>();
  const { profile, sessionRevision } = useAuthStore();
  const [event, setEvent] = useState<Event | null>(null);
  const [persisted, setPersisted] = useState<EventSetlistSong[]>([]);
  const [draft, setDraft] = useState<DraftSetlistSong[]>([]);
  const [originalSignature, setOriginalSignature] = useState("[]");
  const [catalog, setCatalog] = useState<Song[]>([]);
  const [search, setSearch] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [needsReadback, setNeedsReadback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSetlist, setHasSetlist] = useState(false);
  const editing = useRef(false);
  const saving = useRef(false);
  const mounted = useRef(true);
  const revision = useRef(0);
  const dirty = isEditing && signature(draft) !== originalSignature;
  const canEdit = canManageEvents(profile) && !!event && isEventDateEditable(event.start_at);
  const isCurrentSession = () => mounted.current && useAuthStore.getState().sessionRevision === sessionRevision;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; revision.current++; };
  }, []);

  usePreventRemove(dirty || isSaving, ({ data }) => {
    if (saving.current) {
      Alert.alert("Salvando repertório", "Aguarde a conclusão para sair.");
      return;
    }
    Alert.alert("Descartar alterações?", "O repertório ainda não foi salvo.", [
      { text: "Continuar editando", style: "cancel" },
      { text: "Descartar", style: "destructive", onPress: () => navigation.dispatch(data.action) },
    ]);
  });

  const loadScreen = useCallback(async (refresh = false) => {
    const request = ++revision.current;
    setIsLoading(!refresh);
    setIsRefreshing(refresh);
    // Setlist SELECT is broader than event visibility; validate the event first.
    const context = await getEventById(eventId);
    if (request !== revision.current || !mounted.current || useAuthStore.getState().sessionRevision !== sessionRevision) return;
    if (context.error || !context.data) {
      setEvent(null);
      setHasSetlist(false);
      setError(context.error ?? "Evento não encontrado.");
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }
    setEvent(context.data);
    const [setlist, songs] = await Promise.all([getEventSetlist(eventId), getSongsCatalog()]);
    if (request !== revision.current || !mounted.current || useAuthStore.getState().sessionRevision !== sessionRevision) return;
    setCatalog(songs.data ?? []);
    setError(setlist.error ?? songs.error);
    if (!setlist.error) {
      const items = setlist.data ?? [];
      setPersisted(items);
      setHasSetlist(true);
      setNeedsReadback(false);
      if (!editing.current) {
        setDraft(toDraft(items));
        setOriginalSignature(signature(toDraft(items)));
      }
    } else {
      setHasSetlist(false);
    }
    setIsLoading(false);
    setIsRefreshing(false);
  }, [eventId, sessionRevision]);

  useFocusEffect(useCallback(() => {
    void loadScreen();
    return () => { revision.current++; };
  }, [loadScreen]));

  const beginEditing = () => {
    if (!canEdit || !hasSetlist) return;
    const items = toDraft(persisted);
    setDraft(items);
    setOriginalSignature(signature(items));
    editing.current = true;
    setIsEditing(true);
  };

  const cancelEditing = () => {
    const discard = () => {
      if (saving.current) return;
      editing.current = false;
      setIsEditing(false);
      setDraft(toDraft(persisted));
    };
    if (!dirty) { discard(); return; }
    Alert.alert("Descartar alterações?", "O repertório ainda não foi salvo.", [
      { text: "Continuar editando", style: "cancel" },
      { text: "Descartar", style: "destructive", onPress: discard },
    ]);
  };

  const canChangeDraft = () => !saving.current && !needsReadback && !!event &&
    canManageEvents(useAuthStore.getState().profile) && isEventDateEditable(event.start_at);

  const moveSong = (songId: string, direction: -1 | 1) => {
    if (!canChangeDraft()) return;
    setDraft((current) => {
      const index = current.findIndex((item) => item.song_id === songId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  };

  const saveSetlist = async () => {
    if (!event || !canChangeDraft() || !isCurrentSession()) return;
    saving.current = true;
    revision.current++; // A pre-save load must not replace the confirmed result.
    setIsLoading(false);
    setIsRefreshing(false);
    setIsSaving(true);
    const result = await replaceEventSetlist({ eventId, items: draft.map(({ song_id, song_key }) => ({ song_id, song_key })) });
    saving.current = false;
    if (!isCurrentSession()) return;
    setIsSaving(false);
    if (result.error) {
      setNeedsReadback(result.saved);
      if (result.saved) setOriginalSignature(signature(draft));
      setError(result.saved
        ? "Repertório salvo, mas não foi possível reler o resultado. Atualize para conferir antes de editar novamente."
        : result.error);
      return;
    }
    const items = result.data ?? [];
    setPersisted(items);
    setDraft(toDraft(items));
    setOriginalSignature(signature(toDraft(items)));
    setError(null);
    editing.current = false;
    setIsEditing(false);
  };

  const visibleSongs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return catalog.filter((song) => !query || song.title.toLowerCase().includes(query) || song.artist?.toLowerCase().includes(query));
  }, [catalog, search]);
  const selectedIds = new Set(draft.map((item) => item.song_id));

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <HeaderSecondary title="Repertório" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={() => !saving.current && void loadScreen(true)} />
      }>
        {isLoading ? <ActivityIndicator /> : (
          <>
            {event ? <View style={{ marginBottom: 18 }}>
              <Text style={{ fontWeight: "700", fontSize: 20 }}>{event.title}</Text>
              <Text>{formatDateTime(event.start_at)}</Text>
              <Text style={{ color: "#6b7280", marginTop: 8 }}>Este repertório é compartilhado por todas as escalas deste evento.</Text>
              {!canEdit ? <Text style={{ color: "#6b7280", marginTop: 8 }}>Consulta do repertório. A edição exige gestão de eventos e é bloqueada no horário de início.</Text> : null}
            </View> : null}
            {error ? <View style={{ marginBottom: 16 }}>
              <Text style={{ color: "#991b1b" }}>{error}</Text>
              <TouchableOpacity onPress={() => !saving.current && void loadScreen(true)} style={{ paddingVertical: 12 }}><Text>Tentar novamente</Text></TouchableOpacity>
            </View> : null}
            {event && hasSetlist && !isEditing ? <>
              {persisted.length === 0 ? <Text style={{ marginBottom: 16 }}>Nenhuma música definida.</Text> : persisted.map((item) => (
                <TouchableOpacity key={item.id} onPress={() => navigation.navigate("MusicDetails", { songId: item.song_id })} style={{ paddingVertical: 12 }}>
                  <Text style={{ fontWeight: "700" }}>{item.position}. {item.song.title}</Text>
                  <Text style={{ color: "#6b7280" }}>Tom {item.song_key ?? item.song.key ?? "-"}</Text>
                </TouchableOpacity>
              ))}
              {canEdit ? <DefaultButton onPress={beginEditing}>Editar repertório</DefaultButton> : null}
            </> : null}
            {event && isEditing ? <>
              <SetlistEditor songs={draft} isSaving={isSaving} disabled={!canEdit || needsReadback} onMoveSong={moveSong}
                onRemoveSong={(id) => { if (canChangeDraft()) setDraft((current) => current.filter((item) => item.song_id !== id)); }} onSave={saveSetlist} />
              <DefaultButton variant="outline" disabled={isSaving || needsReadback} onPress={cancelEditing}>Cancelar edição</DefaultButton>
              <Input placeholder="Buscar música ou artista..." accessibilityLabel="Buscar música ou artista"
                value={search} onChangeText={setSearch} fieldClassName="bg-muted border-border"
                containerStyle={{ marginVertical: 16 }} returnKeyType="search" />
              {visibleSongs.map((song) => <TouchableOpacity key={song.id} disabled={isSaving || needsReadback || !canEdit || selectedIds.has(song.id)}
                onPress={() => {
                  if (!canChangeDraft()) return;
                  setDraft((current) => current.some((item) => item.song_id === song.id) ? current : [...current, { song_id: song.id, song_key: song.key ?? null, song }]);
                }} style={{ paddingVertical: 12 }}>
                <Text>{song.title} · {selectedIds.has(song.id) ? "No repertório" : "Adicionar"}</Text>
              </TouchableOpacity>)}
            </> : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
