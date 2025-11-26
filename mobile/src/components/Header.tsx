import { View } from "react-native";
import { Avatar, IconButton, Text } from "react-native-paper";

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
  return (
    <View className="flex-row items-center justify-between mb-3">
      {/* Título */}
      <Text variant="headlineSmall" style={{ fontWeight: "800" }}>
        {title}
      </Text>

      {/* Ações à direita */}
      <View className="flex-row items-center">
        <IconButton
          icon="bell-outline"
          size={24}
          onPress={onNotificationPress}
        />
        <Avatar.Image 
          size={32} 
          source={{ uri: avatarUri || "" }}
          style={{ backgroundColor: '#e5e7eb' }}
        />
      </View>
    </View>
  );
}