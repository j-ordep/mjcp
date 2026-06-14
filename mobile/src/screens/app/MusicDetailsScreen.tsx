import { useEffect, useState } from "react";
import { Alert, Linking, ScrollView, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Chip, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderSecondary from "../../components/Header/HeaderSecondary";
import DefaultButton from "../../components/button/DefaultButton";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import { getSongById } from "../../services/musicService";
import type { Song, SongCategory } from "../../types/models";

type MusicDetailsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "MusicDetails"
>;

const CATEGORY_LABELS: Record<SongCategory, string> = {
  louvor: "Louvor",
  adoracao: "Adoracao",
  infantil: "Infantil",
  outro: "Outro",
};

function SongStat({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        padding: 14,
        minWidth: 110,
      }}
    >
      <Text style={{ color: "#6b7280", fontSize: 12, marginBottom: 4 }}>{label}</Text>
      <Text style={{ fontWeight: "700", fontSize: 16 }}>{value}</Text>
    </View>
  );
}

export default function MusicDetailsScreen({
  navigation,
  route,
}: MusicDetailsScreenProps) {
  const { songId } = route.params;
  const [song, setSong] = useState<Song | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [screenError, setScreenError] = useState<string | null>(null);

  const loadSong = async () => {
    setIsLoading(true);
    setScreenError(null);

    const result = await getSongById(songId);

    if (result.error || !result.data) {
      setSong(null);
      setScreenError(
        result.error ?? "Nao foi possivel carregar esta musica agora.",
      );
      setIsLoading(false);
      return;
    }

    setSong(result.data);
    setIsLoading(false);
  };

  useEffect(() => {
    void loadSong();
  }, [songId]);

  const handleOpenSongLink = async () => {
    const songLink = song?.lyrics_url?.trim();

    if (!songLink) {
      Alert.alert("Link indisponivel", "Esta musica ainda nao possui link cadastrado.");
      return;
    }

    try {
      const supported = await Linking.canOpenURL(songLink);

      if (!supported) {
        throw new Error("unsupported");
      }

      await Linking.openURL(songLink);
    } catch {
      Alert.alert("Link indisponivel", "Nao foi possivel abrir o link desta musica.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <HeaderSecondary title="Musica" onBack={() => navigation.goBack()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      >
        {isLoading ? (
          <Text style={{ color: "#6b7280" }}>Carregando musica...</Text>
        ) : screenError ? (
          <View
            style={{
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "#fecaca",
              backgroundColor: "#fef2f2",
              padding: 18,
            }}
          >
            <Text style={{ color: "#991b1b", lineHeight: 22, marginBottom: 14 }}>
              {screenError}
            </Text>
            <DefaultButton variant="outline" onPress={() => void loadSong()}>
              Tentar novamente
            </DefaultButton>
          </View>
        ) : song ? (
          <>
            <View style={{ marginBottom: 18 }}>
              <Text style={{ fontSize: 28, fontWeight: "800", marginBottom: 6 }}>
                {song.title}
              </Text>
              <Text style={{ color: "#6b7280", fontSize: 16 }}>
                {song.artist || "Artista nao informado"}
              </Text>
            </View>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 10,
                marginBottom: 22,
              }}
            >
              {song.category ? (
                <Chip style={{ backgroundColor: "#f3f4f6" }}>
                  {CATEGORY_LABELS[song.category]}
                </Chip>
              ) : null}
              {song.key ? (
                <Chip style={{ backgroundColor: "#f9fafb" }}>Tom {song.key}</Chip>
              ) : null}
              {typeof song.bpm === "number" ? (
                <Chip style={{ backgroundColor: "#f9fafb" }}>{song.bpm} BPM</Chip>
              ) : null}
            </View>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 24,
              }}
            >
              <SongStat label="Tom base" value={song.key || "-"} />
              <SongStat
                label="Categoria"
                value={song.category ? CATEGORY_LABELS[song.category] : "-"}
              />
              <SongStat
                label="Referencia"
                value={song.lyrics_url ? "Com link" : "Sem link"}
              />
            </View>

            <View
              style={{
                borderRadius: 22,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                padding: 18,
                marginBottom: 18,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 8 }}>
                Letra / cifra
              </Text>
              <Text style={{ color: "#6b7280", lineHeight: 22, marginBottom: 16 }}>
                {song.lyrics_url
                  ? "Abra a referencia cadastrada para consultar a letra ou cifra desta musica."
                  : "Esta musica ainda nao possui um link de apoio cadastrado."}
              </Text>
              <DefaultButton
                variant={song.lyrics_url ? "primary" : "outline"}
                onPress={() => void handleOpenSongLink()}
                disabled={!song.lyrics_url}
              >
                {song.lyrics_url ? "Abrir letra / cifra" : "Sem link disponivel"}
              </DefaultButton>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
