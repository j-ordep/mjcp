import { create } from "zustand";
import {
  createMultipleEvents,
  getEvents,
  getUpcomingEvents,
  saveEventWithOptionalRoom,
} from "../services/eventService";
import type { Event } from "../types/models";

interface EventState {
  clearEvents: () => void;
  events: Event[];
  allEvents: Event[];
  isLoadingEvents: boolean;
  isLoadingAllEvents: boolean;
  error: string | null;
  fetchUpcomingEvents: (forceRefresh?: boolean) => Promise<void>;
  fetchEvents: (forceRefresh?: boolean) => Promise<void>;
  createBatchEvents: (
    eventsData: Partial<Event>[],
  ) => Promise<{ data: Event[] | null; error: string | null }>;
  createEventWithRoom: (
    eventData: Partial<Event>,
    roomId: string | null,
  ) => Promise<{ data: Event | null; error: string | null }>;
  updateEventWithRoom: (
    eventId: string,
    updates: Partial<Event>,
    roomId?: string | null,
  ) => Promise<{ data: Event | null; error: string | null }>;
}

export const useEventStore = create<EventState>((set, get) => {
  let sessionRevision = 0;
  let upcomingRevision = 0;
  let allRevision = 0;
  async function refreshEventLists(session: number) {
    if (session !== sessionRevision) return;
    // Reads started before this commit can contain the state before the write.
    const upcomingRequest = ++upcomingRevision;
    const allRequest = ++allRevision;
    const [{ data: events }, { data: allEvents }] = await Promise.all([
      getUpcomingEvents(),
      getEvents(),
    ]);

    if (session !== sessionRevision) return;
    if (upcomingRequest === upcomingRevision) set({ events: events || [], isLoadingEvents: false });
    if (allRequest === allRevision) set({ allEvents: allEvents || [], isLoadingAllEvents: false });
  }

  return {
    events: [],
    allEvents: [],
    isLoadingEvents: false,
    isLoadingAllEvents: false,
    error: null,
    clearEvents: () => {
      ++sessionRevision;
      ++upcomingRevision;
      ++allRevision;
      set({ events: [], allEvents: [], isLoadingEvents: false, isLoadingAllEvents: false, error: null });
    },

    fetchUpcomingEvents: async (forceRefresh = false) => {
      if (!forceRefresh && get().events.length > 0) return;
      const request = ++upcomingRevision;

      set({ isLoadingEvents: true, error: null });

      const { data, error } = await getUpcomingEvents();
      if (request !== upcomingRevision) return;

      if (error) {
        set({ error, isLoadingEvents: false });
      } else {
        set({ events: data || [], isLoadingEvents: false });
      }
    },

    fetchEvents: async (forceRefresh = false) => {
      if (!forceRefresh && get().allEvents.length > 0) return;
      const request = ++allRevision;

      set({ isLoadingAllEvents: true, error: null });

      const { data, error } = await getEvents();
      if (request !== allRevision) return;

      if (error) {
        set({ error, isLoadingAllEvents: false });
      } else {
        set({ allEvents: data || [], isLoadingAllEvents: false });
      }
    },

    createEventWithRoom: async (
      eventData: Partial<Event>,
      roomId: string | null,
    ) => {
      const session = sessionRevision, upcoming = ++upcomingRevision;
      set({ isLoadingEvents: true, error: null });
      const { data, error } = await saveEventWithOptionalRoom({
        event: eventData,
        roomId,
      });
      if (session !== sessionRevision) return { data: error ? null : data, error };

      if (error) {
        if (upcoming === upcomingRevision) set({ error, isLoadingEvents: false });
        return { data: null, error };
      }

      await refreshEventLists(session);
      return { data, error: null };
    },

    createBatchEvents: async (eventsData: Partial<Event>[]) => {
      const session = sessionRevision, upcoming = ++upcomingRevision;
      set({ isLoadingEvents: true, error: null });
      const { data, error } = await createMultipleEvents(eventsData);
      if (session !== sessionRevision) return { data: error ? null : data, error };

      if (error) {
        if (upcoming === upcomingRevision) set({ error, isLoadingEvents: false });
        return { data: null, error };
      }

      await refreshEventLists(session);
      return { data, error: null };
    },

    updateEventWithRoom: async (
      eventId: string,
      updates: Partial<Event>,
      roomId?: string | null,
    ) => {
      const session = sessionRevision, upcoming = ++upcomingRevision;
      set({ isLoadingEvents: true, error: null });
      const { data, error } = await saveEventWithOptionalRoom({
        eventId,
        event: updates,
        roomId,
      });
      if (session !== sessionRevision) return { data: error ? null : data, error };

      if (error) {
        if (upcoming === upcomingRevision) set({ error, isLoadingEvents: false });
        return { data: null, error };
      }

      await refreshEventLists(session);
      return { data, error: null };
    },

  };
});
