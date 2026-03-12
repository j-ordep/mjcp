import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const CHANNEL_ID = "UCDD1ne3PdG18xG81BnrzPhQ";
const API_KEY = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY ?? "";

interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
  isLive: boolean;
}

async function fetchLatestVideos(): Promise<VideoItem[]> {
  // Step 1: Get uploads playlist ID from channel
  const channelRes = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${API_KEY}`,
  );
  const channelData = await channelRes.json();
  const uploadsPlaylistId =
    channelData?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) return [];

  // Step 2: Get latest videos from the uploads playlist
  const playlistRes = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=8&playlistId=${uploadsPlaylistId}&key=${API_KEY}`,
  );
  const playlistData = await playlistRes.json();
  const items = playlistData?.items ?? [];

  // Step 3: Get video details to check for live streams
  const videoIds = items
    .map((item: any) => item?.snippet?.resourceId?.videoId)
    .filter(Boolean)
    .join(",");

  const videosRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails&id=${videoIds}&key=${API_KEY}`,
  );
  const videosData = await videosRes.json();
  const videoDetails: Record<string, any> = {};
  for (const v of videosData?.items ?? []) {
    videoDetails[v.id] = v;
  }

  return items.map((item: any) => {
    const videoId = item?.snippet?.resourceId?.videoId ?? "";
    const detail = videoDetails[videoId];
    const isLive =
      detail?.snippet?.liveBroadcastContent === "live" ||
      detail?.snippet?.liveBroadcastContent === "upcoming";

    // Prefer maxres thumbnail, fallback to high
    const thumbs = item?.snippet?.thumbnails;
    const thumbnail =
      thumbs?.maxres?.url ||
      thumbs?.high?.url ||
      `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    return {
      id: videoId,
      title: item?.snippet?.title ?? "",
      thumbnail,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      isLive,
    };
  });
}

export default function YoutubeCarousel() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!API_KEY || API_KEY === "COLE_SUA_CHAVE_AQUI") {
      setLoading(false);
      return;
    }
    fetchLatestVideos()
      .then(setVideos)
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  }, []);

  if (!API_KEY || API_KEY === "COLE_SUA_CHAVE_AQUI") return null;

  if (loading) {
    return (
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: "#888", fontSize: 14, marginBottom: 10 }}>
          Vídeos recentes
        </Text>
        <ActivityIndicator color="#000" />
      </View>
    );
  }

  if (videos.length === 0) return null;

  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: "#888", fontSize: 14, marginBottom: 10 }}>
        Vídeos recentes
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12 }}
        snapToInterval={220}
        decelerationRate="fast"
      >
        {videos.map((video) => (
          <TouchableOpacity
            key={video.id}
            onPress={() => Linking.openURL(video.url)}
            style={{
              width: 210,
              borderRadius: 14,
              overflow: "hidden",
              backgroundColor: "#f3f4f6",
              borderWidth: 1,
              borderColor: "#e5e7eb",
            }}
            activeOpacity={0.85}
          >
            {/* Thumbnail */}
            <View style={{ position: "relative" }}>
              <Image
                source={{ uri: video.thumbnail }}
                style={{ width: 210, height: 118 }}
                resizeMode="cover"
              />

              {/* Play button overlay */}
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: "rgba(0,0,0,0.72)",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 0,
                      height: 0,
                      borderTopWidth: 7,
                      borderBottomWidth: 7,
                      borderLeftWidth: 13,
                      borderTopColor: "transparent",
                      borderBottomColor: "transparent",
                      borderLeftColor: "#fff",
                      marginLeft: 3,
                    }}
                  />
                </View>
              </View>

              {/* Live badge */}
              {video.isLive && (
                <View
                  style={{
                    position: "absolute",
                    top: 8,
                    left: 8,
                    backgroundColor: "#ef4444",
                    borderRadius: 4,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: "bold",
                      letterSpacing: 0.5,
                    }}
                  >
                    AO VIVO
                  </Text>
                </View>
              )}
            </View>

            {/* Title */}
            <View style={{ padding: 10 }}>
              <Text
                numberOfLines={2}
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: "#111827",
                  lineHeight: 18,
                }}
              >
                {video.title}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
