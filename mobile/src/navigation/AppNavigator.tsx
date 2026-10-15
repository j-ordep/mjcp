import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";

import TabNavigator from "../components/TabNavigator";
import BlockDatesScreen from "../screens/app/BlockDatesScreen";
import CreateEventScreen from "../screens/app/CreateEventScreen";
import CreateScheduleScreen from "../screens/app/CreateScheduleScreen";
import EditScheduleScreen from "../screens/app/EditScheduleScreen";
import EditProfile from "../screens/app/EditProfileScreen";
import EventDetailsScreen from "../screens/app/EventDetailsScreen";
import EventsScreen from "../screens/app/EventsScreen";
import ManageMinistryMembersScreen from "../screens/app/ManageMinistryMembersScreen";
import ManageEventPermissionsScreen from "../screens/app/ManageEventPermissionsScreen";
import MusicDetailsScreen from "../screens/app/MusicDetailsScreen";
import EventSetlistScreen from "../screens/app/EventSetlistScreen";
import ProfileScreen from "../screens/app/ProfileScreen";
import SwapRequestsScreen from "../screens/app/SwapRequestsScreen";
import SignInScreen from "../screens/auth/SignInScreen";
import SignUpScreen from "../screens/auth/SignUpScreen";
import { useAuthStore } from "../stores/useAuthStore";
import type { RootStackParamList } from "../types/navigation";
import { useAuthBootstrap } from "../hooks/useAuthBootstrap";
import { useNotificationSubscription } from "../hooks/useNotificationSubscription";

export type { RootStackParamList, EventDetailsScreenProps, CreateEventScreenProps } from "../types/navigation";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { session, isLoading, sessionRevision } = useAuthStore();
  useAuthBootstrap();
  useNotificationSubscription(session?.user?.id, sessionRevision);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <NavigationContainer key={sessionRevision}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <>
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
            <Stack.Screen name="EventsScreen" component={EventsScreen} />
            <Stack.Screen
              name="BlockDatesScreen"
              component={BlockDatesScreen}
            />
            <Stack.Screen name="EventSetlist" component={EventSetlistScreen} getId={({ params }) => params.eventId} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="EditProfile" component={EditProfile} />
            <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
            <Stack.Screen
              name="CreateSchedule"
              component={CreateScheduleScreen}
            />
            <Stack.Screen
              name="EditSchedule"
              component={EditScheduleScreen}
            />
            <Stack.Screen
              name="MusicDetails"
              component={MusicDetailsScreen}
            />
            <Stack.Screen
              name="ManageMinistryMembers"
              component={ManageMinistryMembersScreen}
            />
            <Stack.Screen
              name="ManageEventPermissions"
              component={ManageEventPermissionsScreen}
            />
            <Stack.Screen
              name="SwapRequests"
              component={SwapRequestsScreen}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
