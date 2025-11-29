import { Avatar, Text } from "react-native-paper";
import { View } from "react-native";

interface ProfileAvatarProps {
  uri: string;
  name: string;
}

export default function ProfileAvatar({ uri, name }: ProfileAvatarProps) {
  return (
    <View style={{ alignItems: "center" }}>
      <Avatar.Image
        size={110}
        source={{ uri }}
        style={{ marginBottom: 12 }}
      />
      <Text style={{ fontSize: 22, fontWeight: "bold", marginTop: 8 }}>{name}</Text>
    </View>
  );
}