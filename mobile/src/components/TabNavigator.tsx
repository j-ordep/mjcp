import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { DoorOpen, Home, Music, User } from "lucide-react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from "../screens/app/HomeScreen";
import MusicScreen from "../screens/app/MusicScreen";
import ProfileScreen from "../screens/app/ProfileScreen";
import RoomsScreen from "../screens/app/RoomsScreen";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const insets = useSafeAreaInsets();

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