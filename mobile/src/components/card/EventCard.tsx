import { MapPin } from "lucide-react-native";
import { View } from "react-native";
import { Card, Text } from "react-native-paper";
import DefaultButton from "../button/DefaultButton";

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

export default function EventCard(props: EventCardProps) {
  return (
    <Card
      style={{
        marginBottom: 16,
        borderRadius: 20,
        paddingVertical: 8,
        backgroundColor: "#fff",
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
          <View className="flex-row items-center mt-2 mb-3">
            <MapPin size={18} color="#888" style={{ marginRight: 4 }} />
            <Text style={{ color: "#888", fontSize: 15 }}>{props.location}</Text>
          </View>
        )}
        <View className="flex-row gap-8 mt-1">
          <View className="flex-1">
            <Text style={{ color: "#888", fontSize: 13, marginBottom: 2 }}>
              Departamento
            </Text>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>{props.department}</Text>
          </View>
          <View className="flex-1">
            <Text style={{ color: "#888", fontSize: 13, marginBottom: 2 }}>
              Função
            </Text>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>{props.role}</Text>
          </View>
        </View>
      </Card.Content>
      <View className="flex-row gap-3 px-4 pb-4">
        <View className="flex-1">
          <DefaultButton variant="outline" onPress={props.onSwap}>
            Preciso trocar
          </DefaultButton>
        </View>

        <View className="flex-1">
          <DefaultButton variant="primary" onPress={props.onConfirm}>
            Confirmar
          </DefaultButton>
        </View>
      </View>
    </Card>
  );
}