import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Calendar, Home, User } from "lucide-react-native";
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import EventDetailsScreen from "../screens/EventDetailsScreen";
import EventsScreen from "../screens/EventsScreen";
import HomeScreen from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SignUp from "../screens/SignUp";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  EventDetails: { title: string; date: string; role?: string };
};

function MainTabs() {
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

export default function AppNavigator() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUp} />
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
