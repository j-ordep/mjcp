import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from 'react-native-safe-area-context';

import TabNavigator from "../components/TabNavigator";
import EventDetailsScreen from "../screens/app/EventDetailsScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import SignUp from "../screens/auth/SignUp";

const Stack = createNativeStackNavigator();

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  EventDetails: { title: string; date: string; role?: string };
};

export default function AppNavigator() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUp} />
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
