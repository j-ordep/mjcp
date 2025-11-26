import { View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import Button from "./Button";

interface EventCardProps {
  title: string;
  date: string;
  role?: string;
  onConfirm?: () => void;
  onSwap?: () => void;
  onDetails?: () => void;
}

export default function EventCard({ title, date, role, onConfirm, onSwap, onDetails }: EventCardProps) {
  const theme = useTheme();

   return (
    <Card style={{ marginBottom: 16 }} onPress={onDetails}>
      <Card.Content style={{ paddingVertical: 24 }}>
        <Text variant="titleLarge" style={{ fontWeight: "600", marginBottom: 8 }}>
          {title}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.secondary, fontWeight: "500" }}>
          {date}
        </Text>
        {role && (
          <Text variant="bodyLarge" style={{ color: theme.colors.primary, marginTop: 4 }}>
            Função: {role}
          </Text>
        )}
      </Card.Content>
      <View className="flex-row gap-2 px-4 pb-4">
        <View className="flex-1">
          <Button variant="outline" onPress={onSwap}>Preciso trocar</Button>
        </View>
        <View className="flex-1">
          <Button variant="secondary" onPress={onConfirm}>Confirmar</Button>
        </View>
      </View>
    </Card>
  );
}