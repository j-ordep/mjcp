import { ChevronLeft } from "lucide-react-native"
import { View } from "react-native"
import { Text } from "react-native-paper";


interface HeaderSecondaryProps {
  title: string;
  onBack: () => void;
}

export default function HeaderSecondary(props: HeaderSecondaryProps) {
  return (
    <View className="flex-row items-center px-5 pt-5 pb-3">
      <ChevronLeft size={24} onPress={props.onBack} />
      <Text style={{
        fontWeight: "bold",
        fontSize: 18,
        flex: 1,
        textAlign: "center",
        marginRight: 25
      }}>
        {props.title}
      </Text>
    </View>
  );
}
