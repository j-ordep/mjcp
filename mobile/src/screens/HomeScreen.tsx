import { View } from "react-native";
import { Avatar, IconButton, Text } from "react-native-paper";

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-white pt-12 px-4">

      {/* HEADER */}
      <View className="flex-row items-center justify-between mb-6">
        
        {/* Menu */}
        <IconButton
          icon="menu"
          size={28}
          onPress={() => {}}
        />

        {/* Título */}
        <Text variant="titleMedium" style={{ fontWeight: "600" }}>
          Próximo evento
        </Text>

        {/* Ações à direita */}
        <View className="flex-row items-center">
          <IconButton
            icon="bell-outline"
            size={24}
            onPress={() => {}}
          />
          <Avatar.Image 
            size={32} 
            source={{ uri: "" }}
          />
        </View>
      </View>

    </View>
  );
}