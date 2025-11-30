import { View } from "react-native";
import { IconButton, Text } from "react-native-paper";
import { ChevronLeft, MoreVertical } from "lucide-react-native";

interface ProfileHeaderProps {
  onBack: () => void;
  onMenu: () => void;
}

export default function ProfileHeader(props: ProfileHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-1.5 pt-1.5">
      <IconButton
        icon={() => <ChevronLeft size={24} />} 
        onPress={props.onBack} />
      <Text style={{ fontWeight: "bold", fontSize: 18 }}>Perfil</Text>
      <IconButton icon={() => <MoreVertical size={24} />}
        onPress={props.onMenu} />
    </View>
  );
}