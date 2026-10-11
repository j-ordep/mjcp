import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CalendarDays, DoorOpen, Music, Users } from "lucide-react-native";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import ScheduleScreen from "../screens/app/ScheduleScreen";
import ManageMinistryMembersScreen from "../screens/app/ManageMinistryMembersScreen";
import MusicScreen from "../screens/app/MusicScreen";
import RoomsScreen from "../screens/app/RoomsScreen";
import { useAuthStore } from "../stores/useAuthStore";
import { useMinistryStore } from "../stores/useMinistryStore";
import { useNotificationStore } from "../stores/useNotificationStore";
import type { MainTabParamList, RootStackParamList } from "../types/navigation";
import { getProfileAvatarUri } from "../utils/profileAvatar";
import HeaderPrimary from "./Header/HeaderPrimary";
import NotificationsModal from "./utils/NotificationsModal";

const Tab = createBottomTabNavigator<MainTabParamList>();
const titles: Record<keyof MainTabParamList, string> = {
  Schedules: "Escalas", Rooms: "Salas", Music: "Músicas", ManageMembers: "Equipe",
};

export default function TabNavigator() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profile, session } = useAuthStore();
  const { userMinistries, userMinistriesUserId, error, fetchUserMinistries } = useMinistryStore();
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  useEffect(() => {
    if (session?.user?.id) void fetchUserMinistries();
  }, [fetchUserMinistries, session?.user?.id]);
  const showTeam = profile?.role === "admin" ||
    (!error && userMinistriesUserId === session?.user?.id && userMinistries.some((ministry) => ministry.is_leader));
  return (
    <>
      <Tab.Navigator initialRouteName="Schedules" screenOptions={({ route }) => ({
        header: () => (
          <SafeAreaView edges={["top", "left", "right"]} style={{ backgroundColor: "white" }}>
            <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
              <HeaderPrimary title={titles[route.name]} avatarUri={getProfileAvatarUri(profile?.avatar_url) ?? undefined}
                avatarLabel={profile?.full_name ?? undefined} notificationUnreadCount={unreadCount}
                onAvatarPress={() => navigation.navigate("Profile")}
                onNotificationPress={() => setNotificationsVisible(true)} />
            </View>
          </SafeAreaView>
        ),
        tabBarActiveTintColor: "#000000", tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: { borderTopWidth: 0, height: 45 + (insets.bottom > 0 ? insets.bottom : 24) },
        tabBarLabelStyle: { fontSize: 12 },
      })}>
        <Tab.Screen name="Schedules" component={ScheduleScreen} options={{ tabBarLabel: "Escalas", tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} /> }} />
        <Tab.Screen name="Rooms" component={RoomsScreen} options={{ tabBarLabel: "Salas", tabBarIcon: ({ color, size }) => <DoorOpen color={color} size={size} /> }} />
        <Tab.Screen name="Music" component={MusicScreen} options={{ tabBarLabel: "Músicas", tabBarIcon: ({ color, size }) => <Music color={color} size={size} /> }} />
        {showTeam ? <Tab.Screen name="ManageMembers" component={ManageMinistryMembersScreen} options={{ tabBarLabel: "Equipe", tabBarIcon: ({ color, size }) => <Users color={color} size={size} /> }} /> : null}
      </Tab.Navigator>
      <NotificationsModal visible={notificationsVisible} onDismiss={() => setNotificationsVisible(false)} />
    </>
  );
}
