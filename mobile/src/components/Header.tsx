import { TouchableOpacity, View } from "react-native";
import { Avatar, IconButton, Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

type TabParamList = {
  Home: undefined;
  Events: undefined;
  Profile: undefined;
};

interface HeaderProps {
  title: string;
  onNotificationPress?: () => void;
  onAvatarPress?: () => void;
  avatarUri?: string;
}

export default function Header({ 
  title, 
  onNotificationPress, 
  onAvatarPress,
  avatarUri 
}: HeaderProps) {

  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();

  return (
    <View className="flex-row items-center justify-between mb-3">
      {/* Título */}
      <Text variant="headlineSmall" style={{ fontWeight: "800" }}>
        {title}
      </Text>

      {/* Ações à direita */}
      <View className="flex-row items-center gap-2">
        <IconButton
          icon="bell-outline"
          size={24}
          onPress={onNotificationPress}
        />
        <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
          <Avatar.Image 
            size={32} 
            source={{ uri: avatarUri || "https://i.pravatar.cc/150?img=3" }}
            style={{ backgroundColor: '#e5e7eb' }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}