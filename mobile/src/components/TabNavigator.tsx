import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { DoorOpen, Home, Music, User, Users } from "lucide-react-native";
import { useEffect, useMemo } from "react";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from "../screens/app/HomeScreen";
import ManageMinistryMembersScreen from "../screens/app/ManageMinistryMembersScreen";
import MusicScreen from "../screens/app/MusicScreen";
import ProfileScreen from "../screens/app/ProfileScreen";
import RoomsScreen from "../screens/app/RoomsScreen";
import { useAuthStore } from "../stores/useAuthStore";
import { useMinistryStore } from "../stores/useMinistryStore";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const insets = useSafeAreaInsets();
  const { profile, session } = useAuthStore();
  const { userMinistries, fetchUserMinistries } = useMinistryStore();

  useEffect(() => {
    if (!session?.user?.id) return;
    void fetchUserMinistries();
  }, [fetchUserMinistries, session?.user?.id]);

  const showMemberManagementTab = useMemo(() => {
    if (profile?.role === "admin") return true;
    return userMinistries.some((ministry) => ministry.is_leader);
  }, [profile?.role, userMinistries]);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          borderTopWidth: 0,
          borderTopColor: '#e5e7eb',
          height: 45 + (insets.bottom > 0 ? insets.bottom : 24),          
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={size ?? 24} />
          ),
        }}
      />
      <Tab.Screen
        name="Rooms"
        component={RoomsScreen}
        options={{
          tabBarLabel: 'Salas',
          tabBarIcon: ({ color, size }) => (
            <DoorOpen color={color} size={size ?? 24} />
          ),
        }}
      />
      <Tab.Screen
        name="Music"
        component={MusicScreen}
        options={{
          tabBarLabel: 'Músicas',
          tabBarIcon: ({ color, size }) => (
            <Music color={color} size={size ?? 24} />
          ),
        }}
      />
      {showMemberManagementTab ? (
        <Tab.Screen
          name="ManageMembers"
          component={ManageMinistryMembersScreen}
          options={{
            tabBarLabel: "Membros",
            tabBarIcon: ({ color, size }) => (
              <Users color={color} size={size ?? 24} />
            ),
          }}
        />
      ) : null}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <User color={color} size={size ?? 24} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
