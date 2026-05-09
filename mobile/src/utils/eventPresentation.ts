import type { EventCategory } from "./eventCategory";
import { normalizeEventCategory } from "./eventCategory";

export interface InformationalEventViewModel {
  title: string;
  category: EventCategory;
  startAt: string;
  endAt: string | null;
  location: string;
  description: string;
}

export interface EventEditorInitialData {
  title: string;
  category: EventCategory;
  description: string | null;
  location: string | null;
  start_at: string;
  end_at: string | null;
  is_public: boolean;
}

type InformationalEventFields = {
  title: string;
  category?: string | null;
  start_at: string;
  end_at?: string | null;
  location?: string | null;
  description?: string | null;
};

type EventEditorEventFields = {
  title: string;
  category?: string | null;
  description?: string | null;
  location?: string | null;
  start_at: string;
  end_at?: string | null;
  is_public?: boolean | null;
};

export function toInformationalEventViewModel(
  event: InformationalEventFields,
): InformationalEventViewModel {
  return {
    title: event.title,
    category: normalizeEventCategory(event.category),
    startAt: event.start_at,
    endAt: event.end_at ?? null,
    location: event.location?.trim() || "NÃ£o informado",
    description: event.description?.trim() || "Sem descriÃ§Ã£o.",
  };
}

export function toEventEditorInitialData(
  event: EventEditorEventFields,
): EventEditorInitialData {
  return {
    title: event.title,
    category: normalizeEventCategory(event.category),
    description: event.description ?? null,
    location: event.location ?? null,
    start_at: event.start_at,
    end_at: event.end_at ?? null,
    is_public: event.is_public ?? true,
  };
}
