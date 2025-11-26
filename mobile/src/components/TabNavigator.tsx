import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Calendar, Home, User } from "lucide-react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from "../screens/app/HomeScreen";
import EventsScreen from "../screens/app/EventsScreen";
import ProfileScreen from "../screens/app/ProfileScreen";

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
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 10,
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
        name="Events"
        component={EventsScreen}
        options={{
          tabBarLabel: 'Eventos',
          tabBarIcon: ({ color, size }) => (
            <Calendar color={color} size={size ?? 24} />
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