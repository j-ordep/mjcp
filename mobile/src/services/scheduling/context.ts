import { supabase } from "../../lib/supabase";
import { firstRelation, type SupabaseRelation } from "../../utils/ministryMappers";
import type { TableRow } from "../../types/database.types";
import { getProfilesByIds } from "../profileService";
import { isEventDateReadOnly } from "../../utils/scheduleRules";
import type { VisibleProfile, ScheduleContext, ScheduleContextRow } from "../../types/scheduling";

export async function getVisibleProfileMap(userIds: string[]) {
  const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
  if (uniqueUserIds.length === 0) {
    return { data: new Map<string, VisibleProfile>(), error: null };
  }

  const result = await getProfilesByIds(uniqueUserIds);
  if (result.error) {
    return { data: null, error: result.error };
  }

  return {
    data: new Map(
      (result.data ?? []).map((profile) => [
        profile.id,
        {
          id: profile.id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
        },
      ]),
    ),
    error: null,
  };
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }
  return 'Erro inesperado.';
}

export async function getScheduleContext(scheduleId: string): Promise<{ data: ScheduleContext | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select(`
        id,
        ministry_id,
        events!inner (
          id,
          start_at
          ,end_at
        )
      `)
      .eq('id', scheduleId)
      .single<ScheduleContextRow>();

    if (error) throw error;

    const joinedEvent = firstRelation(data.events);

    return {
      data: {
        id: data.id,
        ministry_id: data.ministry_id,
        event: joinedEvent,
      },
      error: null,
    };
  } catch (error: unknown) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function isEventEditableById(eventId: string): Promise<{ editable: boolean; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('start_at')
      .eq('id', eventId)
      .single<Pick<TableRow<'events'>, 'start_at'>>();

    if (error) throw error;

    return { editable: !isEventDateReadOnly(data.start_at), error: null };
  } catch (error: unknown) {
    return { editable: false, error: getErrorMessage(error) };
  }
}

export async function getAssignmentScheduleContext(assignmentId: string): Promise<{
  data: ScheduleContext | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from("schedule_assignments")
      .select(`
        id,
        schedules!inner (
          id,
          ministry_id,
          events!inner (
            id,
            start_at,
            end_at
          )
        )
      `)
      .eq("id", assignmentId)
      .single<{
        id: string;
        schedules: SupabaseRelation<ScheduleContextRow>;
      }>();

    if (error) throw error;

    const schedule = firstRelation(data.schedules);
    const event = schedule?.events ? firstRelation(schedule.events) : null;

    if (!schedule || !event) {
      throw new Error("Escala nao encontrada.");
    }

    return {
      data: {
        id: schedule.id,
        ministry_id: schedule.ministry_id,
        event,
      },
      error: null,
    };
  } catch (error: unknown) {
    return { data: null, error: getErrorMessage(error) };
  }
}
