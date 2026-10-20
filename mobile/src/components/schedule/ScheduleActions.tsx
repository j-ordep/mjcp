import { Text } from "../ui/text";
import { ArrowLeftRight, CalendarOff, Plus } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";
import type { TextStyle, ViewStyle } from "react-native";


interface ScheduleActionsProps {
  canCreate: boolean;
  onOpenSwaps: () => void;
  onOpenBlockedDates: () => void;
  onCreate: () => void;
}

export default function ScheduleActions({
  canCreate,
  onOpenSwaps,
  onOpenBlockedDates,
  onCreate,
}: ScheduleActionsProps) {
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <TouchableOpacity
          onPress={onOpenSwaps}
          accessibilityRole="button"
          accessibilityLabel="Trocas"
          style={secondaryActionStyle}
        >
          <ArrowLeftRight size={22} color="#111827" />
          <Text style={secondaryLabelStyle}>Trocas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onOpenBlockedDates}
          accessibilityRole="button"
          accessibilityLabel="Indisponibilidades"
          style={secondaryActionStyle}
        >
          <CalendarOff size={22} color="#111827" />
          <Text style={secondaryLabelStyle}>Indisponibilidades</Text>
        </TouchableOpacity>
      </View>
      {canCreate ? (
        <TouchableOpacity
          onPress={onCreate}
          accessibilityRole="button"
          accessibilityLabel="Criar escala"
          style={{
            minHeight: 48, padding: 12, gap: 8, borderRadius: 16,
            backgroundColor: "#111827", flexDirection: "row",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Plus size={20} color="#fff" />
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>Criar escala</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const secondaryActionStyle: ViewStyle = {
  flex: 1,
  minHeight: 74,
  padding: 10,
  gap: 6,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: "#d1d5db",
  backgroundColor: "#f9fafb",
  alignItems: "center",
  justifyContent: "center",
};

const secondaryLabelStyle: TextStyle = {
  fontSize: 13,
  fontWeight: "600",
  textAlign: "center",
  color: "#111827",
};
