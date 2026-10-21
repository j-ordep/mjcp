import { colors } from "../../theme/colors";
import { Text } from "../ui/text";
import { TouchableOpacity, View } from "react-native";

import DefaultButton from "../button/DefaultButton";
import type { EventSetlistSong } from "../../services/musicService";
import type { Event } from "../../types/models";
import { formatDateTime } from "../../utils/formatDate";

interface Props {
  event: Event | null;
  songs: EventSetlistSong[];
  onOpenSong: (songId: string) => void;
  onOpenSetlist: () => void;
}

export default function NextEventSetlistCard({
  event,
  songs,
  onOpenSong,
  onOpenSetlist,
}: Props) {
  return (
    <View
      style={{
        backgroundColor: colors.primary,
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
        <Text style={{ color: colors.primaryForeground, fontWeight: "700", fontSize: 15 }}>
          Próximo repertório
        </Text>
        {event ? (
          <Text style={{ color: colors.inverseMuted, fontSize: 12 }}>
            {songs.length} música(s)
          </Text>
        ) : null}
      </View>

      {event ? (
        <>
          <Text
            style={{
              color: colors.primaryForeground,
              fontWeight: "800",
              fontSize: 18,
              marginBottom: 4,
            }}
          >
            {event.title}
          </Text>
          <Text style={{ color: colors.inverseMuted, marginBottom: 12 }}>
            {formatDateTime(event.start_at)}
          </Text>

          {songs.length > 0 ? (
            songs.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => onOpenSong(item.song.id)}
                activeOpacity={0.8}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 8,
                  borderTopWidth: 1,
                  borderTopColor: colors.primaryBorder,
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: colors.primaryPressed,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                  }}
                >
                  <Text
                    style={{ color: colors.primaryForeground, fontSize: 12, fontWeight: "700" }}
                  >
                    {item.position}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.primaryForeground, fontWeight: "600" }}>
                    {item.song.title}
                  </Text>
                  <Text style={{ color: colors.inverseMuted, fontSize: 12 }}>
                    {item.song.artist || "Sem artista"} · Tom{" "}
                    {item.song_key || item.song.key || "-"}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={{ color: colors.inverseMuted, lineHeight: 20 }}>
              Nenhuma música definida para o próximo evento ainda.
            </Text>
          )}

          <View style={{ marginTop: 14 }}>
            <DefaultButton variant="outline" onPress={onOpenSetlist}>Abrir repertório</DefaultButton>
          </View>
        </>
      ) : (
        <Text style={{ color: colors.inverseMuted, lineHeight: 20 }}>
          Ainda não há evento futuro para montar setlist.
        </Text>
      )}
    </View>
  );
}
