import { View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import Button from "./Button";

interface EventCardProps {
  title: string;
  date: string;
  onPress?: () => void;
}

export default function EventCard({ title, date, onPress }: EventCardProps) {
  const theme = useTheme();
  return (
    <Card style={{ marginBottom: 16 }}>
      <Card.Content style={{ paddingVertical: 24 }}>
        <Text variant="titleLarge" style={{ fontWeight: "600", marginBottom: 8 }}>
          {title}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.secondary, fontWeight: "500" }}>
          {date}
        </Text>
      </Card.Content>
      
      <View className="flex-row gap-2 px-4 pb-4">
        <View className="flex-1">
          <Button variant="outline" onPress={onPress}>Ver detalhes</Button>
        </View>
        <View className="flex-1">
          <Button variant="secondary" onPress={onPress}>Confirmar</Button>
        </View>
      </View>
    </Card>
  );
}