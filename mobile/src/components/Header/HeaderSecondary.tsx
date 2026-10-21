import { Text } from "../ui/text";
import { ChevronLeft } from "lucide-react-native"
import { TouchableOpacity, View } from "react-native"
import { colors } from "../../theme/colors";


interface HeaderSecondaryProps {
  title: string;
  onBack: () => void;
  rightIcon?: React.ReactNode;
  onRightPress?: () => void;
}

export default function HeaderSecondary(props: HeaderSecondaryProps) {
  return (
    <View className="flex-row items-center gap-2 bg-card px-5 pt-3 pb-3">
      <TouchableOpacity onPress={props.onBack} accessibilityRole="button" accessibilityLabel="Voltar" style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
        <ChevronLeft size={24} color={colors.foreground} />
      </TouchableOpacity>
      
      <Text style={{
        fontWeight: "bold",
        fontSize: 18,
        flex: 1,
        textAlign: "center",
      }}>
        {props.title}
      </Text>

      {props.rightIcon ? (
        <TouchableOpacity 
          onPress={props.onRightPress}
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: colors.secondary,
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {props.rightIcon}
        </TouchableOpacity>
      ) : (
        <View style={{ width: 44 }} />
      )}
    </View>
  );
}
