import { supabase } from "../lib/supabase";
import type { Event, Song } from "../types/models";
import { getUpcomingEvents } from "./eventService";

export interface EventSetlistSong {
  id: string;
  event_id: string;
  song_id: string;
  position: number;
  song_key: string | null;
  song: Song;
}

interface EventSetlistRow {
  id: string;
  event_id: string;
  song_id: string;
  position: number;
  song_key: string | null;
  songs: Song | Song[] | null;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return "Erro inesperado.";
}

function firstRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function mapEventSetlistRow(row: EventSetlistRow): EventSetlistSong | null {
  const song = firstRelation(row.songs);

  if (!song) {
    return null;
  }

  return {
    id: row.id,
    event_id: row.event_id,
    song_id: row.song_id,
    position: row.position,
    song_key: row.song_key,
    song,
  };
}

export async function getSongsCatalog() {
  try {
    const { data, error } = await supabase
      .from("songs")
      .select("*")
      .order("title", { ascending: true });

    if (error) throw error;

    return {
      data: (data ?? []) as Song[],
      error: null,
    };
  } catch (error: unknown) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getEventSetlist(eventId: string) {
  try {
    const { data, error } = await supabase
      .from("event_setlists")
      .select(`
        id,
        event_id,
        song_id,
        position,
        song_key,
        songs (
          id,
          title,
          artist,
          key,
          bpm,
          category,
          lyrics_url,
          created_at
        )
      `)
      .eq("event_id", eventId)
      .order("position", { ascending: true });

    if (error) throw error;

    return {
      data: ((data ?? []) as EventSetlistRow[])
        .map(mapEventSetlistRow)
        .filter((item): item is EventSetlistSong => item !== null),
      error: null,
    };
  } catch (error: unknown) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getNextUpcomingEventSetlist() {
  try {
    const upcomingResult = await getUpcomingEvents(1);

    if (upcomingResult.error) {
      throw new Error(upcomingResult.error);
    }

    const nextEvent = upcomingResult.data?.[0] ?? null;

    if (!nextEvent) {
      return {
        data: {
          event: null as Event | null,
          songs: [] as EventSetlistSong[],
        },
        error: null,
      };
    }

    const setlistResult = await getEventSetlist(nextEvent.id);

    if (setlistResult.error) {
      throw new Error(setlistResult.error);
    }

    return {
      data: {
        event: nextEvent,
        songs: setlistResult.data ?? [],
      },
      error: null,
    };
  } catch (error: unknown) {
    return {
      data: null,
      error: getErrorMessage(error),
    };
  }
}

export async function replaceEventSetlist(input: {
  eventId: string;
  items: Array<{
    song_id: string;
    song_key?: string | null;
  }>;
}) {
  try {
    const { error: deleteError } = await supabase
      .from("event_setlists")
      .delete()
      .eq("event_id", input.eventId);

    if (deleteError) throw deleteError;

    if (input.items.length === 0) {
      return { data: [] as EventSetlistSong[], error: null };
    }

    const { error: insertError } = await supabase
      .from("event_setlists")
      .insert(
        input.items.map((item, index) => ({
          event_id: input.eventId,
          song_id: item.song_id,
          song_key: item.song_key ?? null,
          position: index + 1,
        })),
      );

    if (insertError) throw insertError;

    const setlistResult = await getEventSetlist(input.eventId);

    if (setlistResult.error) {
      throw new Error(setlistResult.error);
    }

    return {
      data: setlistResult.data ?? [],
      error: null,
    };
  } catch (error: unknown) {
    return {
      data: null,
      error: getErrorMessage(error),
    };
  }
}
