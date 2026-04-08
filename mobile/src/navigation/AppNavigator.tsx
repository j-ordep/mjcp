import { NavigationContainer } from "@react-navigation/native";
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import TabNavigator from "../components/TabNavigator";
import { supabase } from "../lib/supabase";
import BlockDatesScreen from "../screens/app/BlockDatesScreen";
import CreateEventScreen from "../screens/app/CreateEventScreen";
import CreateScheduleScreen from "../screens/app/CreateScheduleScreen";
import EditScheduleScreen from "../screens/app/EditScheduleScreen";
import EditProfile from "../screens/app/EditProfileScreen";
import EventDetailsScreen from "../screens/app/EventDetailsScreen";
import EventsScreen from "../screens/app/EventsScreen";
import ManageMinistryMembersScreen from "../screens/app/ManageMinistryMembersScreen";
import MySchedulesScreen from "../screens/app/MySchedulesScreen";
import ProfileScreen from "../screens/app/ProfileScreen";
import SignInScreen from "../screens/auth/SignInScreen";
import SignUpScreen from "../screens/auth/SignUpScreen";
import { getProfile } from "../services/profileService";
import { useAuthStore } from "../stores/useAuthStore";

export type RootStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  Main: undefined;
  EventsScreen: undefined;
  EventDetails: { event: import("../types/models").Event };
  Profile: undefined;
  EditProfile: undefined;
  BlockDatesScreen: undefined;
  MySchedulesScreen: undefined;
  CreateEvent:
    | {
        mode?: "edit";
        eventId?: string;
        initialData?: import("../types/models").Event;
      }
    | undefined;
  CreateSchedule: undefined;
  EditSchedule: {
    scheduleId: string;
  };
  ManageMinistryMembers:
    | {
        ministryId?: string;
      }
    | undefined;
};

export type EventDetailsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "EventDetails"
>;

export type CreateEventScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "CreateEvent"
>;

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { session, isLoading, setSession, setProfile, setLoading } =
    useAuthStore();

  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        setSession(session);

        if (session?.user?.id) {
          const { profile } = await getProfile(session.user.id);
          if (isMounted) {
            setProfile(profile);
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Erro ao restaurar sessao:", error);
        if (isMounted) {
          setSession(null);
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    bootstrapAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);

      if (session?.user?.id) {
        const { profile } = await getProfile(session.user.id);
        setProfile(profile);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [setLoading, setProfile, setSession]);

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
    <NavigationContainer>
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
            <Stack.Screen
              name="MySchedulesScreen"
              component={MySchedulesScreen}
            />
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
              name="ManageMinistryMembers"
              component={ManageMinistryMembersScreen}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
