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

export default function ActivityCard(props: ActivityCardProps) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={props.onPress}>
      <Card style={{
        borderRadius: 20,
        marginRight: 16,
        marginTop: 6,
        marginBottom: 6,
        minWidth: 230,
        maxWidth: 230,
        minHeight: 180,
        borderWidth: 1,
        borderColor: "#f3f4f6",
      }}>
        <Card.Content>
          {/* Top row: Icon, Title, Timestamp */}
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <IconButton icon={props.icon} size={22} style={{ margin: 0, marginRight: 6, marginTop: -4 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "bold", fontSize: 15 }} numberOfLines={1}>{props.title}</Text>
              <Text style={{ color: "#888", fontSize: 13, marginTop: 2 }}>{props.subtitle}</Text>
            </View>
            <Text style={{ color: "#888", fontSize: 13, marginLeft: 6, marginTop: 2 }}>{props.timestamp}</Text>
          </View>
          {/* Content */}
          <View style={{ marginTop: 28 }}>
            <Text style={{ fontSize: 15 }}>{props.content}</Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}