import { TouchableOpacity, View } from "react-native";
import { Avatar, IconButton, Text } from "react-native-paper";
import { Bell } from "lucide-react-native";
import { getProfileInitials } from "../../utils/profileAvatar";

interface HeaderPrimaryProps {
  title: string;
  subtitle?: string;
  onNotificationPress?: () => void;
  onAvatarPress?: () => void;
  avatarUri?: string;
  avatarLabel?: string;
  notificationUnreadCount?: number;
}

export default function HeaderPrimary(props: HeaderPrimaryProps) {
  const unreadCount = props.notificationUnreadCount ?? 0;
  const unreadBadgeLabel = unreadCount > 9 ? "9+" : String(unreadCount);

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
        <View style={{ position: "relative" }}>
          <IconButton
            icon={() => <Bell size={23} color="#222" />}
            size={24}
            onPress={props.onNotificationPress}
          />
          {unreadCount > 0 ? (
            <View
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: "#1d4ed8",
                paddingHorizontal: 4,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>
                {unreadBadgeLabel}
              </Text>
            </View>
          ) : null}
        </View>
        <TouchableOpacity onPress={props.onAvatarPress}>
          {props.avatarUri ? (
            <Avatar.Image
              size={32}
              source={{ uri: props.avatarUri }}
              style={{ backgroundColor: "#e5e7eb" }}
            />
          ) : (
            <Avatar.Text
              size={32}
              label={getProfileInitials(props.avatarLabel)}
              color="#111111"
              style={{ backgroundColor: "#e5e7eb" }}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
