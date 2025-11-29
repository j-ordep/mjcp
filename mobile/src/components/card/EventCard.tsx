import { MapPin } from "lucide-react-native";
import { View } from "react-native";
import { Card, Text } from "react-native-paper";
import CardButton from "../button/CardButton";

interface EventCardProps {
  title: string;
  date: string;
  location?: string
  role: string;
  department?: string;
  onConfirm?: () => void;
  onSwap?: () => void;
  onDetails?: () => void;
}

export default function EventCard( props: EventCardProps ) {
  return (
    <Card
      style={{
        marginBottom: 16,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#ececec",
        minHeight: 230,
        backgroundColor: "#fff",
        elevation: 0,
      }}
      onPress={props.onDetails}
    >
      <Card.Content style={{ paddingVertical: 18 }}>
        <Text style={{ fontWeight: "bold", fontSize: 20, marginBottom: 6 }}>
          {props.title}
        </Text>
        <Text style={{ color: "#222", fontWeight: "500", marginBottom: 6 }}>
          {props.date}
        </Text>
        {props.location && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 10,
              marginBottom: 14,
            }}
          >
            <MapPin size={18} color="#888" style={{ marginRight: 4 }} />
            <Text style={{ color: "#888", fontSize: 15 }}>{props.location}</Text>
          </View>
        )}
        <View style={{ flexDirection: "row", gap: 32, marginTop: 4 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#888", fontSize: 13, marginBottom: 2 }}>
              Departamento
            </Text>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>{props.department}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#888", fontSize: 13, marginBottom: 2 }}>
              Função
            </Text>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>{props.role}</Text>
          </View>
        </View>
      </Card.Content>
      <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingBottom: 16 }}>
        <View style={{ flex: 1 }}>
          <CardButton variant="outline" onPress={props.onSwap}>
            Preciso trocar
          </CardButton>
        </View>
        <View style={{ flex: 1 }}>
          <CardButton variant="primary" onPress={props.onConfirm}>
            Confirmar
          </CardButton>
        </View>
      </View>
    </Card>
  );
}