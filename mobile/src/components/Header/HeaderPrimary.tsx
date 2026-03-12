import { TouchableOpacity, View } from "react-native";
import { Avatar, IconButton, Text } from "react-native-paper";
import { Bell } from "lucide-react-native";

interface HeaderPrimaryProps {
  title: string;
  subtitle?: string;
  onNotificationPress?: () => void;
  onAvatarPress?: () => void;
  avatarUri?: string;
}

export default function HeaderPrimary(props: HeaderPrimaryProps) {
  return (
    <View className="flex-row items-center justify-between mb-3">
      <View>
        {props.subtitle && (
          <Text style={{ color: "#888", fontSize: 13, marginBottom: 2 }}>
            {props.subtitle}
          </Text>
        )}
        <Text variant="headlineSmall" style={{ fontWeight: "800" }}>
          {props.title}
        </Text>
      </View>

      <View className="flex-row items-center gap-2">
        <IconButton
          icon={() => <Bell size={23} color="#222" />}
          size={24}
          onPress={props.onNotificationPress}
        />
        <TouchableOpacity onPress={props.onAvatarPress}>
          <Avatar.Image
            size={32}
            source={{ uri: props.avatarUri || "https://avatar.iran.liara.run/public/46" }}
            style={{ backgroundColor: '#e5e7eb' }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}