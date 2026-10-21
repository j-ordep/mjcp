import { colors } from "../../theme/colors";
import { Text } from "../ui/text";
import { ArrowLeftRight, CalendarOff } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";
import type { TextStyle, ViewStyle } from "react-native";


interface ScheduleActionsProps {
  onOpenSwaps: () => void;
  onOpenBlockedDates: () => void;
}

export default function ScheduleActions({
  onOpenSwaps,
  onOpenBlockedDates,
}: ScheduleActionsProps) {
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
        <TouchableOpacity
          onPress={onOpenSwaps}
          accessibilityRole="button"
          accessibilityLabel="Trocas"
          style={secondaryActionStyle}
        >
          <ArrowLeftRight size={18} color={colors.mutedForeground} />
          <Text style={secondaryLabelStyle}>Trocas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onOpenBlockedDates}
          accessibilityRole="button"
          accessibilityLabel="Indisponibilidades"
          style={secondaryActionStyle}
        >
          <CalendarOff size={18} color={colors.mutedForeground} />
          <Text style={secondaryLabelStyle}>Indisponibilidades</Text>
        </TouchableOpacity>
    </View>
  );
}

const secondaryActionStyle: ViewStyle = {
  flex: 1,
  minHeight: 44,
  padding: 10,
  gap: 8,
  flexDirection: "row",
  borderRadius: 12,
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: colors.muted,
  alignItems: "center",
  justifyContent: "center",
};

const secondaryLabelStyle: TextStyle = {
  fontSize: 12,
  flexShrink: 1,
  fontWeight: "600",
  textAlign: "center",
  color: colors.foreground,
};
