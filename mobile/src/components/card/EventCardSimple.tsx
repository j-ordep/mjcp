import { Calendar, MapPin } from "lucide-react-native";
import { View } from "react-native";
import { Card, Text } from "react-native-paper";

interface EventCardSimpleProps {
  title: string;
  date: string;
  location?: string;
  description?: string;
  onPress?: () => void;
}

export default function EventCardSimple(props: EventCardSimpleProps) {
  return (
    <Card
      style={{
        marginBottom: 16,
        borderRadius: 20,
        backgroundColor: "#fff",
      }}
      onPress={props.onPress}
    >
      <Card.Content style={{ paddingVertical: 18 }}>
        <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 6 }}>
          {props.title}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
          <Calendar size={16} color="#888" style={{ marginRight: 6 }} />
          <Text style={{ color: "#555", fontSize: 14 }}>{props.date}</Text>
        </View>
        {props.location && (
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
            <MapPin size={16} color="#888" style={{ marginRight: 6 }} />
            <Text style={{ color: "#888", fontSize: 14 }}>{props.location}</Text>
          </View>
        )}
        {props.description && (
          <Text style={{ color: "#666", fontSize: 14, marginTop: 4 }} numberOfLines={2}>
            {props.description}
          </Text>
        )}
      </Card.Content>
    </Card>
  );
}
