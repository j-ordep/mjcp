import { Text } from "../ui/text";
import { ArrowDown, ArrowUp, X } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";

import DefaultButton from "../button/DefaultButton";
import type { EventSetlistSong } from "../../services/musicService";

export type DraftSetlistSong = Pick<
  EventSetlistSong,
  "song_id" | "song_key" | "song"
>;

interface Props {
  songs: DraftSetlistSong[];
  isSaving: boolean;
  disabled?: boolean;
  onMoveSong: (songId: string, direction: -1 | 1) => void;
  onRemoveSong: (songId: string) => void;
  onSave: () => Promise<void>;
}

export default function SetlistEditor({
  songs,
  isSaving,
  disabled = false,
  onMoveSong,
  onRemoveSong,
  onSave,
}: Props) {
  return (
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
        Toque na lista abaixo para adicionar músicas. Reordene as escolhidas e
        salve.
      </Text>

      {songs.length === 0 ? (
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
        songs.map((item, index) => (
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
                {item.song.artist || "Sem artista"} · Tom{" "}
                {item.song_key || item.song.key || "-"}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                disabled={isSaving || disabled || index === 0}
                onPress={() => onMoveSong(item.song_id, -1)}
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
                disabled={isSaving || disabled || index === songs.length - 1}
                onPress={() => onMoveSong(item.song_id, 1)}
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
                disabled={isSaving || disabled}
                onPress={() => onRemoveSong(item.song_id)}
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
        onPress={() => void onSave()}
        isLoading={isSaving}
        disabled={disabled}
      >
        Salvar setlist
      </DefaultButton>
    </View>
  );
}
