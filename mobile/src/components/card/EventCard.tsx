import { MapPin } from "lucide-react-native";
import { View } from "react-native";
import { Card, Text } from "react-native-paper";
import CardButton from "../button/CardButton";

export default function EventCard({
  title,
  date,
  location,
  role,
  department,
  onConfirm,
  onSwap,
  onDetails,
}) {
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
      onPress={onDetails}
    >
      <Card.Content style={{ paddingVertical: 18 }}>
        <Text style={{ fontWeight: "bold", fontSize: 20, marginBottom: 6 }}>
          {title}
        </Text>
        <Text style={{ color: "#222", fontWeight: "500", marginBottom: 6 }}>
          {date}
        </Text>
        {location && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 10, // espaçamento acima
              marginBottom: 14, // espaçamento abaixo
            }}
          >
            <MapPin size={18} color="#888" style={{ marginRight: 4 }} />
            <Text style={{ color: "#888", fontSize: 15 }}>{location}</Text>
          </View>
        )}
        <View style={{ flexDirection: "row", gap: 32, marginTop: 4 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#888", fontSize: 13, marginBottom: 2 }}>
              Departamento
            </Text>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>{department}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#888", fontSize: 13, marginBottom: 2 }}>
              Função
            </Text>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>{role}</Text>
          </View>
        </View>
      </Card.Content>
      <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingBottom: 16 }}>
        <View style={{ flex: 1 }}>
          <CardButton variant="outline" onPress={onSwap}>
            Preciso trocar
          </CardButton>
        </View>
        <View style={{ flex: 1 }}>
          <CardButton variant="primary" onPress={onConfirm}>
            Confirmar
          </CardButton>
        </View>
      </View>
    </Card>
  );
}