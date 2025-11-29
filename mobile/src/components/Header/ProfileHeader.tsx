import { View } from "react-native";
import { IconButton, Text } from "react-native-paper";
import { ChevronLeft, MoreVertical } from "lucide-react-native";

interface ProfileHeaderProps {
  onBack: () => void;
  onMenu: () => void;
}

export default function ProfileHeader({ onBack, onMenu }: ProfileHeaderProps) {
  return (
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
    }}>
      <IconButton icon={() => <ChevronLeft size={24} />} onPress={onBack} />
      <Text style={{ fontWeight: "bold", fontSize: 16 }}>Perfil</Text>
      <IconButton icon={() => <MoreVertical size={24} />} onPress={onMenu} />
    </View>
  );
}