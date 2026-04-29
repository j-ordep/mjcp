import { create } from "zustand";
import {
  createEvent,
  createMultipleEvents,
  getEvents,
  getUpcomingEvents,
  updateEvent,
} from "../services/eventService";
import { Event } from "../types/models";

interface EventState {
  events: Event[];
  allEvents: Event[];
  isLoadingEvents: boolean;
  isLoadingAllEvents: boolean;
  error: string | null;
  fetchUpcomingEvents: (forceRefresh?: boolean) => Promise<void>;
  fetchEvents: (forceRefresh?: boolean) => Promise<void>;
  createNewEvent: (
    eventData: Partial<Event>,
  ) => Promise<{ data: Event | null; error: string | null }>;
  createBatchEvents: (
    eventsData: Partial<Event>[],
  ) => Promise<{ data: Event[] | null; error: string | null }>;
  updateExistingEvent: (
    eventId: string,
    updates: Partial<Event>,
  ) => Promise<{ data: Event | null; error: string | null }>;
}

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  allEvents: [],
  isLoadingEvents: false,
  isLoadingAllEvents: false,
  error: null,

  fetchUpcomingEvents: async (forceRefresh = false) => {
    if (!forceRefresh && get().events.length > 0) return;

    set({ isLoadingEvents: true, error: null });

    const { data, error } = await getUpcomingEvents();

    if (error) {
      set({ error, isLoadingEvents: false });
    } else {
      set({ events: data || [], isLoadingEvents: false });
    }
  },

  fetchEvents: async (forceRefresh = false) => {
    if (!forceRefresh && get().allEvents.length > 0) return;

    set({ isLoadingAllEvents: true, error: null });

    const { data, error } = await getEvents();

    if (error) {
      set({ error, isLoadingAllEvents: false });
    } else {
      set({ allEvents: data || [], isLoadingAllEvents: false });
    }
  },

  createNewEvent: async (eventData: Partial<Event>) => {
    set({ isLoadingEvents: true, error: null });
    const { data, error } = await createEvent(eventData);

    if (error) {
      set({ error, isLoadingEvents: false });
      return { data: null, error };
    } else {
      const [{ data: freshEvents }, { data: freshAllEvents }] = await Promise.all([
        getUpcomingEvents(),
        getEvents(),
      ]);
      set({
        events: freshEvents || [],
        allEvents: freshAllEvents || [],
        isLoadingEvents: false,
        isLoadingAllEvents: false,
      });
      return { data, error: null };
    }
  },

  createBatchEvents: async (eventsData: Partial<Event>[]) => {
    set({ isLoadingEvents: true, error: null });
    const { data, error } = await createMultipleEvents(eventsData);

    if (error) {
      set({ error, isLoadingEvents: false });
      return { data: null, error };
    } else {
      const [{ data: freshEvents }, { data: freshAllEvents }] = await Promise.all([
        getUpcomingEvents(),
        getEvents(),
      ]);
      set({
        events: freshEvents || [],
        allEvents: freshAllEvents || [],
        isLoadingEvents: false,
        isLoadingAllEvents: false,
      });
      return { data, error: null };
    }
  },

  updateExistingEvent: async (eventId: string, updates: Partial<Event>) => {
    set({ isLoadingEvents: true, error: null });
    const { data, error } = await updateEvent(eventId, updates);

    if (error) {
      set({ error, isLoadingEvents: false });
      return { data: null, error };
    } else {
      const [{ data: freshEvents }, { data: freshAllEvents }] = await Promise.all([
        getUpcomingEvents(),
        getEvents(),
      ]);
      set({
        events: freshEvents || [],
        allEvents: freshAllEvents || [],
        isLoadingEvents: false,
        isLoadingAllEvents: false,
      });
      return { data, error: null };
    }
  },
}));
