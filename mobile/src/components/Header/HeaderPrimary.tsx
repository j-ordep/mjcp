import { Text } from "../ui/text";
import { TouchableOpacity, View } from "react-native";
import { Avatar, IconButton } from "react-native-paper";
import { Bell } from "lucide-react-native";
import { getProfileInitials } from "../../utils/profileAvatar";
import { colors } from "../../theme/colors";

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
      <View style={{ flex: 1, paddingRight: 12 }}>
        {props.subtitle && (
          <Text style={{ color: colors.mutedForeground, fontSize: 13, marginBottom: 2 }}>
            {props.subtitle}
          </Text>
        )}
        <Text variant="h4" style={{ fontWeight: "800" }}>
          {props.title}
        </Text>
      </View>

      <View className="flex-row items-center gap-2">
        <View style={{ position: "relative" }}>
          <IconButton
            icon={() => <Bell size={23} color={colors.foreground} />}
            accessibilityLabel="Abrir notificações"
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
                backgroundColor: colors.primary,
                paddingHorizontal: 4,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: colors.primaryForeground, fontSize: 10, fontWeight: "700" }}>
                {unreadBadgeLabel}
              </Text>
            </View>
          ) : null}
        </View>
        <TouchableOpacity onPress={props.onAvatarPress} accessibilityRole="button" accessibilityLabel="Abrir perfil" style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}>
          {props.avatarUri ? (
            <Avatar.Image
              size={32}
              source={{ uri: props.avatarUri }}
              style={{ backgroundColor: colors.secondary }}
            />
          ) : (
            <Avatar.Text
              size={32}
              label={getProfileInitials(props.avatarLabel)}
              color={colors.secondaryForeground}
              style={{ backgroundColor: colors.secondary }}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
