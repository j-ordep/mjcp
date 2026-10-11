import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Event } from "./models";
import type { EventEditorInitialData } from "../utils/eventPresentation";

export type MainTabParamList = {
  Schedules: undefined;
  Rooms: undefined;
  Music: undefined;
  ManageMembers: undefined;
};

export type RootStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  EventsScreen: undefined;
  EventDetails: {
    event: Pick<
      Event,
      "id" | "title" | "description" | "location" | "start_at"
    > &
    Partial<
      Pick<Event, "category" | "end_at" | "is_public">
    >;
  };
  Profile: undefined;
  EditProfile: undefined;
  BlockDatesScreen: undefined;
  CreateEvent:
  | {
    mode: "edit";
    eventId: string;
    initialData?: EventEditorInitialData;
  }
  | {
    mode?: undefined;
    eventId?: never;
    initialData?: never;
  }
  | undefined;
  CreateSchedule: undefined;
  EditSchedule: {
    scheduleId: string;
  };
  MusicDetails: {
    songId: string;
  };
  EventSetlist: { eventId: string };
  ManageMinistryMembers:
  | {
    ministryId?: string;
  }
  | undefined;
  ManageEventPermissions: undefined;
  SwapRequests: undefined;
};

export type EventDetailsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "EventDetails"
>;

export type CreateEventScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "CreateEvent"
>;
