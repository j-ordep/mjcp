import { View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import CardButton from "../button/CardButton";

interface EventCardProps {
  title: string;
  date: string;
  role?: string;
  department?: string;
  onConfirm?: () => void;
  onSwap?: () => void;
  onDetails?: () => void;
}

export default function EventCard({ title, date, role, department, onConfirm, onSwap, onDetails }: EventCardProps) {
  const theme = useTheme();

  return (
    <Card style={{ marginBottom: 16 }} onPress={onDetails}>
      <Card.Content style={{ paddingVertical: 24 }}>
        <Text variant="titleLarge" style={{ fontWeight: "bold", marginBottom: 8 }}>
          {title}
        </Text>

        <Text variant="bodyMedium" style={{ color: theme.colors.secondary, fontWeight: "500" }}>
          {date}
        </Text>

        <View style={{ flexDirection: "row", gap: 32, marginTop: 8 }}>
          <View style={{ flex: 1 }}>
            <Text>Departamento</Text>
            <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 2 }}>{department}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text>Função</Text>
            <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 2 }}>{role}</Text>
          </View>
        </View>

      </Card.Content>
      <View className="flex-row gap-2 px-4 pb-4">
        <View className="flex-1">
          <CardButton variant="outline" onPress={onSwap}>Preciso trocar</CardButton>
        </View>
        <View className="flex-1">
          <CardButton variant="secondary" onPress={onConfirm}>Confirmar</CardButton>
        </View>
      </View>
    </Card>
  );
}