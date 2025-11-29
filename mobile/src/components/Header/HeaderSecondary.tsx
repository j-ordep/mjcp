import { ChevronLeft } from "lucide-react-native"
import { TouchableOpacity, View } from "react-native"
import { Text } from "react-native-paper";

export default function HeaderSecondary({ navigation, title }) {
  return (
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" }}>
        <ChevronLeft size={24} onPress={() => navigation.goBack()} />
        <Text style={{ fontWeight: "bold", fontSize: 18, flex: 1, textAlign: "center", marginRight: 32 }}>{title}</Text>
      </View>
  )
}
