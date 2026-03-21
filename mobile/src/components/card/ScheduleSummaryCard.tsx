import { TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";

interface ScheduleSummaryCardProps {
  title: string;
  date: string;
  role?: string;
  location?: string;
  onPress?: () => void;
}

export default function ScheduleSummaryCard(props: ScheduleSummaryCardProps) {
  return (
    <TouchableOpacity
      onPress={props.onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 18,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: "#f0f0f0",
      }}
    >
      <View className="flex-row items-center justify-between">
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text
            style={{ fontWeight: "bold", fontSize: 15, color: "#111827" }}
            numberOfLines={1}
          >
            {props.title}
          </Text>
          <View className="flex-row items-center mt-1">
            <Text style={{ color: "#888", fontSize: 13 }}>{props.date}</Text>
            {props.location && (
              <Text style={{ color: "#888", fontSize: 13 }}>
                {"  •  "}
                {props.location}
              </Text>
            )}
          </View>
        </View>

        {props.role && (
          <View
            style={{
              backgroundColor: "#f3f4f6",
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#374151" }}>
              {props.role}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
