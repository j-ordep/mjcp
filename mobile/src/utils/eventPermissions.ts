import type { UserProfile } from "../types/models";

type EventManagerProfile =
  | Pick<UserProfile, "role" | "can_manage_events">
  | null
  | undefined;

export function canManageEvents(profile: EventManagerProfile) {
  return profile?.role === "admin" || profile?.can_manage_events === true;
}
