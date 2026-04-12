import { MapPin } from "lucide-react-native";
import { View } from "react-native";
import { Card, Text } from "react-native-paper";
import DefaultButton from "../button/DefaultButton";

interface EventCardProps {
  title: string;
  date: string;
  location?: string
  role?: string;
  department?: string;
  description?: string;
  onConfirm?: () => void;
  onSwap?: () => void;
  onDetails?: () => void;
  showActions?: boolean;
  swapLabel?: string;
  swapVariant?: 'outline' | 'destructive';
  confirmLabel?: string;
  confirmDisabled?: boolean;
  swapDisabled?: boolean;
  actionHint?: string;
  participationStatusLabel?: string;
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
        <Text style={{ color: "#000", fontWeight: "bold", fontSize: 16, marginBottom: 6 }}>
          {props.date}
        </Text>
        {props.location && (
          <View className="flex-row items-center mt-2 mb-3">
            <MapPin size={18} color="#888" style={{ marginRight: 4 }} />
            <Text style={{ color: "#888", fontSize: 15 }}>{props.location}</Text>
          </View>
        )}
        
        {props.description && (
          <Text 
            numberOfLines={2} 
            style={{ color: "#444", fontSize: 14, marginBottom: 12, lineHeight: 20 }}
          >
            {props.description}
          </Text>
        )}
        
        {(props.department || props.role) && (
          <View className="flex-row gap-8 mt-1">
            {props.department && (
              <View className="flex-1">
                <Text style={{ color: "#888", fontSize: 13, marginBottom: 2 }}>
                  Departamento
                </Text>
                <Text style={{ fontSize: 16, fontWeight: "bold" }}>{props.department}</Text>
              </View>
            )}
            {props.role && (
              <View className="flex-1">
                <Text style={{ color: "#888", fontSize: 13, marginBottom: 2 }}>
                  Função
                </Text>
                <Text style={{ fontSize: 16, fontWeight: "bold" }}>{props.role}</Text>
              </View>
            )}
          </View>
        )}

        {props.participationStatusLabel ? (
          <Text style={{ color: "#6b7280", fontSize: 13, marginTop: 10 }}>
            Status da participacao: {props.participationStatusLabel}
          </Text>
        ) : null}
      </Card.Content>

      {props.showActions && (
        <View className="px-4 pb-4">
          {props.actionHint ? (
            <Text style={{ color: "#6b7280", fontSize: 13, marginBottom: 10 }}>
              {props.actionHint}
            </Text>
          ) : null}

          <View className="flex-row gap-3">
            <View className="flex-1">
              <DefaultButton
                variant={props.swapVariant ?? "outline"}
                onPress={props.onSwap}
                disabled={props.swapDisabled}
              >
              {props.swapLabel ?? "Preciso trocar"}
              </DefaultButton>
            </View>

            <View className="flex-1">
              <DefaultButton
                variant="primary"
                onPress={props.onConfirm}
                disabled={props.confirmDisabled}
              >
                {props.confirmLabel ?? "Confirmar"}
              </DefaultButton>
            </View>
          </View>
        </View>
      )}
    </Card>
  );
}
