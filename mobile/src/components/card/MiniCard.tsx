import { Dimensions, TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";

const screenWidth = Dimensions.get("window").width;

export default function MiniCard({ title, icon, onPress, backgroundColor = "#fff", textColor = "#000000" }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor,
        borderRadius: 18,
        paddingVertical: 10,
        flex: 1,
        height: 80,
        marginHorizontal: 4,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 1,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </View>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontWeight: "bold", fontSize: 13, textAlign: "center", color: textColor }}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}