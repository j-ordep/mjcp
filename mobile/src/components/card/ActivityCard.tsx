import { TouchableOpacity, View } from "react-native";
import { Card, IconButton, Text } from "react-native-paper";

interface ActivityCardProps {
  icon: string;
  title: string;
  subtitle: string;
  content: string;
  timestamp: string;
  onPress?: () => void;
}

export default function ActivityCard({ icon, title, subtitle, content, timestamp, onPress }: ActivityCardProps) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <Card style={{
        borderRadius: 20,
        marginRight: 16,
        minWidth: 230,
        maxWidth: 230,
        minHeight: 180, // aumente conforme necessário
        borderWidth: 1,
        borderColor: "#f3f4f6",
      }}>
        <Card.Content>
          {/* Top row: Icon, Title, Timestamp */}
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <IconButton icon={icon} size={22} style={{ margin: 0, marginRight: 6, marginTop: -4 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "bold", fontSize: 15 }} numberOfLines={1}>{title}</Text>
              <Text style={{ color: "#888", fontSize: 13, marginTop: 2 }}>{subtitle}</Text>
            </View>
            <Text style={{ color: "#888", fontSize: 13, marginLeft: 6, marginTop: 2 }}>{timestamp}</Text>
          </View>
          {/* Content */}
          <View style={{ marginTop: 28 }}>
            <Text style={{ fontSize: 15 }}>{content}</Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}