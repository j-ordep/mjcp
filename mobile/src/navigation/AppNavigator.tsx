import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from 'react-native-safe-area-context';

import TabNavigator from "../components/TabNavigator";
import EventDetailsScreen from "../screens/app/EventDetailsScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import SignUpScreen from "../screens/auth/SignUpScreen";
import EventsScreen from "../screens/app/EventsScreen";
import EditProfile from "../screens/app/EditProfileScreen";
import BlockDatesScreen from "../screens/app/BlockDatesScreen";

const Stack = createNativeStackNavigator();

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  EventsScreen: undefined;
  EventDetails: undefined; //{ title: string; date: string; role?: string };
  EditProfile: undefined;
  BlockDatesScreen: undefined;
};

export default function AppNavigator() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
          <Stack.Screen name="EventsScreen" component={EventsScreen} />
          <Stack.Screen name="BlockDatesScreen" component={BlockDatesScreen} />
          <Stack.Screen name="EditProfile" component={EditProfile} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
