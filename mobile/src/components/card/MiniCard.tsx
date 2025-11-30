import { Dimensions, TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";

const screenWidth = Dimensions.get("window").width;

export default function MiniCard({ title, icon, onPress, backgroundColor = "#fff", textColor = "#000000" }) {
  return (
     <TouchableOpacity
      onPress={onPress}
      className="flex-1 min-h-[76px] mx-1.5 mt-1 items-center rounded-2xl py-2 shadow"
      style={{ backgroundColor }}>
      
      <View className="flex-row items-center justify-center pt-1">
        {icon}
      </View>
      <View className="flex-1 items-center justify-center">
        <Text style={{ fontWeight: "bold", fontSize: 13, textAlign: "center", color: textColor }}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}