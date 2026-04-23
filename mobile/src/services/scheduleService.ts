import { supabase } from '../lib/supabase';
import type { AssignmentStatus, TableRow } from '../types/database.types';
import {
  countAssignmentsByStatus,
  isEventDateEditable,
  isEventDateReadOnly,
  rangesOverlap,
  toISODateString,
} from "../utils/scheduleRules";

export interface UpcomingSchedule {
  id: string; // assignment_id
  schedule_id: string;
  role_id: string;
  status: AssignmentStatus | 'vago';
  role_name: string;
  event: {
    id: string;
    title: string;
    start_at: string;
    location: string | null;
    description: string | null;
  };
}

/** Shape do retorno de getAssignmentsByEvent — tipagem explícita, sem `any`.
 * NOTA: PostgREST retorna joins como arrays mesmo em relações 1:1.
 * O mapeamento para o shape limpo acontece nos componentes consumidores.
 */
export interface AssignmentWithDetails {
  id: string;
  schedule_id: string;
  user_id: string;
  role_id: string;
  status: 'pending' | 'confirmed' | 'declined' | 'swapped';
  ministry_roles: {
    name: string;
    ministries: { name: string }[] | null;
  }[] | null;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  }[] | null;
}

export interface AssignmentIntegrityValidation {
  isValid: boolean;
  isEventEditable: boolean;
  isRoleFromScheduleMinistry: boolean;
  isUserMemberOfScheduleMinistry: boolean;
  doesUserHaveCapability: boolean;
  error: string | null;
}

export interface MinistryRoleOption {
  id: string;
  ministry_id: string;
  name: string;
}

export interface MinistryMemberOption {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  capability_role_ids: string[];
}

export interface ScheduleAssignmentDetailed {
  id: string;
  user_id: string;
  role_id: string;
  status: 'pending' | 'confirmed' | 'declined' | 'swapped';
  member_name: string;
  role_name: string;
}

export interface AssignmentWarningBlockedDate {
  type: 'blocked_date';
  date: string; // YYYY-MM-DD
}

export interface AssignmentWarningConflict {
  type: 'conflict';
  event_id: string;
  event_title: string;
  ministry_name: string | null;
  role_name: string | null;
  start_at: string;
  end_at: string | null;
}

export type AssignmentWarning =
  | AssignmentWarningBlockedDate
  | AssignmentWarningConflict;

interface ScheduleContext {
  id: string;
  ministry_id: string;
  event: {
    id: string;
    start_at: string;
    end_at: string | null;
  } | null;
}

interface ScheduleContextRow {
  id: string;
  ministry_id: string;
  events:
    | {
        id: string;
        start_at: string;
        end_at: string | null;
      }
    | {
        id: string;
        start_at: string;
        end_at: string | null;
      }[]
    | null;
}

interface UpcomingUserScheduleRow {
  id: string;
  schedule_id: string;
  role_id: string;
  status: AssignmentStatus;
  schedules:
    | {
        event_id: string;
        events:
          | {
              id: string;
              title: string;
              start_at: string;
              location: string | null;
              description: string | null;
            }
          | {
              id: string;
              title: string;
              start_at: string;
              location: string | null;
              description: string | null;
            }[];
      }
    | {
        event_id: string;
        events:
          | {
              id: string;
              title: string;
              start_at: string;
              location: string | null;
              description: string | null;
            }
          | {
              id: string;
              title: string;
              start_at: string;
              location: string | null;
              description: string | null;
            }[];
      }[];
  ministry_roles:
    | {
        name: string;
      }
    | {
        name: string;
      }[];
}

interface UpcomingAllScheduleAssignmentRow {
  id: string;
  user_id: string;
  role_id: string;
  status: AssignmentStatus;
  ministry_roles:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
  profiles:
    | {
        full_name: string | null;
      }
    | {
        full_name: string | null;
      }[]
    | null;
}

interface UpcomingAllScheduleRow {
  id: string;
  ministry_id: string;
  event_id: string;
  events:
    | {
        id: string;
        title: string;
        start_at: string;
        location: string | null;
        description: string | null;
      }
    | {
        id: string;
        title: string;
        start_at: string;
        location: string | null;
        description: string | null;
      }[];
  schedule_assignments: UpcomingAllScheduleAssignmentRow[];
}

interface ScheduleCardManageableRow {
  id: string;
  created_at: string;
  ministry_id: string;
  event_id: string;
  events:
    | {
        id: string;
        title: string;
        start_at: string;
        location: string | null;
        description: string | null;
      }
    | {
        id: string;
        title: string;
        start_at: string;
        location: string | null;
        description: string | null;
      }[];
  ministries:
    | {
        id: string;
        name: string;
      }
    | {
        id: string;
        name: string;
      }[]
    | null;
  schedule_assignments:
    | {
        id: string;
        user_id: string;
        role_id: string;
        status: AssignmentStatus;
        ministry_roles:
          | {
              name: string;
            }
          | {
              name: string;
            }[]
          | null;
      }[]
    | null;
}

interface ScheduleCardMemberRow {
  id: string;
  schedule_id: string;
  role_id: string;
  status: AssignmentStatus;
  ministry_roles:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
  schedules:
    | {
        id: string;
        created_at: string;
        event_id: string;
        ministry_id: string;
        events:
          | {
              id: string;
              title: string;
              start_at: string;
              location: string | null;
              description: string | null;
            }
          | {
              id: string;
              title: string;
              start_at: string;
              location: string | null;
              description: string | null;
            }[];
        ministries:
          | {
              id: string;
              name: string;
            }
          | {
              id: string;
              name: string;
            }[]
          | null;
        schedule_assignments:
          | {
              id: string;
              status: AssignmentStatus;
            }[]
          | null;
      }
    | {
        id: string;
        created_at: string;
        event_id: string;
        ministry_id: string;
        events:
          | {
              id: string;
              title: string;
              start_at: string;
              location: string | null;
              description: string | null;
            }
          | {
              id: string;
              title: string;
              start_at: string;
              location: string | null;
              description: string | null;
            }[];
        ministries:
          | {
              id: string;
              name: string;
            }
          | {
              id: string;
              name: string;
            }[]
          | null;
        schedule_assignments:
          | {
              id: string;
              status: AssignmentStatus;
            }[]
          | null;
      }[]
    | null;
}

interface ScheduleDetailsRow {
  id: string;
  event_id: string;
  ministry_id: string;
  created_at: string;
  events:
    | {
        id: string;
        title: string;
        start_at: string;
        end_at: string | null;
        location: string | null;
        description: string | null;
        is_public: boolean;
      }
    | {
        id: string;
        title: string;
        start_at: string;
        end_at: string | null;
        location: string | null;
        description: string | null;
        is_public: boolean;
      }[]
    | null;
  ministries:
    | {
        id: string;
        name: string;
        color: string | null;
      }
    | {
        id: string;
        name: string;
        color: string | null;
      }[]
    | null;
}

interface ConflictQueryRow {
  id: string;
  status: AssignmentStatus;
  schedules:
    | {
        id: string;
        event_id: string;
        ministries: { name: string } | { name: string }[] | null;
        events:
          | {
              id: string;
              title: string;
              start_at: string;
              end_at: string | null;
            }
          | {
              id: string;
              title: string;
              start_at: string;
              end_at: string | null;
            }[];
      }
    | {
        id: string;
        event_id: string;
        ministries: { name: string } | { name: string }[] | null;
        events:
          | {
              id: string;
              title: string;
              start_at: string;
              end_at: string | null;
            }
          | {
              id: string;
              title: string;
              start_at: string;
              end_at: string | null;
            }[];
      }[]
    | null;
  ministry_roles: { name: string } | { name: string }[] | null;
}

interface MinistryMemberOptionRow {
  user_id: string;
  profiles:
    | {
        full_name: string | null;
        avatar_url: string | null;
      }
    | {
        full_name: string | null;
        avatar_url: string | null;
      }[]
    | null;
  ministry_member_roles:
    | {
        role_id: string;
      }[]
    | null;
}

interface ScheduleAssignmentDetailedRow {
  id: string;
  user_id: string;
  role_id: string;
  status: AssignmentStatus;
  profiles:
    | {
        full_name: string | null;
        avatar_url: string | null;
      }
    | {
        full_name: string | null;
        avatar_url: string | null;
      }[]
    | null;
  ministry_roles:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
}

interface SwapRequestRow {
  id: string;
  from_assignment_id: string;
  to_assignment_id: string | null;
  to_user_id: string | null;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

interface SwapAssignmentContextRow {
  id: string;
  schedule_id: string;
  user_id: string;
  role_id: string;
  status: AssignmentStatus;
  profiles:
    | {
        full_name: string | null;
        avatar_url: string | null;
      }
    | {
        full_name: string | null;
        avatar_url: string | null;
      }[]
    | null;
  ministry_roles:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
  schedules:
    | {
        ministry_id: string;
        event_id: string;
        events:
          | {
              id: string;
              title: string;
              start_at: string;
            }
          | {
              id: string;
              title: string;
              start_at: string;
            }[];
        ministries:
          | {
              id: string;
              name: string;
            }
          | {
              id: string;
              name: string;
            }[]
          | null;
      }
    | {
        ministry_id: string;
        event_id: string;
        events:
          | {
              id: string;
              title: string;
              start_at: string;
            }
          | {
              id: string;
              title: string;
              start_at: string;
            }[];
        ministries:
          | {
              id: string;
              name: string;
            }
          | {
              id: string;
              name: string;
            }[]
          | null;
      }[]
    | null;
}

interface SwapProfileRow {
  id: string;
  full_name: string | null;
}

function getErrorMessage(error: unknown) {
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

function firstRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function compareScheduleCardsByDate(a: ScheduleCard, b: ScheduleCard) {
  return new Date(a.event.start_at).getTime() - new Date(b.event.start_at).getTime();
}

async function getScheduleContext(scheduleId: string): Promise<{ data: ScheduleContext | null; error: string | null }> {
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

async function isEventEditableById(eventId: string): Promise<{ editable: boolean; error: string | null }> {
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

async function getAssignmentScheduleContext(assignmentId: string): Promise<{
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
        schedules:
          | {
              id: string;
              ministry_id: string;
              events:
                | {
                    id: string;
                    start_at: string;
                    end_at: string | null;
                  }
                | {
                    id: string;
                    start_at: string;
                    end_at: string | null;
                  }[];
            }
          | {
              id: string;
              ministry_id: string;
              events:
                | {
                    id: string;
                    start_at: string;
                    end_at: string | null;
                  }
                | {
                    id: string;
                    start_at: string;
                    end_at: string | null;
                  }[];
            }[];
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

export async function getUpcomingUserSchedules(userId: string) {
  try {
    const { data, error } = await supabase
      .from('schedule_assignments')
      .select(`
        id,
        schedule_id,
        role_id,
        status,
        schedules!inner (
          event_id,
          events!inner (
            id,
            title,
            start_at,
            location,
            description
          )
        ),
        ministry_roles!inner (
          name
        )
      `)
      .eq('user_id', userId)
      // #11 Filtro de eventos futuros feito na query para evitar tráfego desnecessário
      .gte('schedules.events.start_at', new Date().toISOString());

    if (error) throw error;
    
    if (!data) return { data: [], error: null };

    const formattedData = (data as UpcomingUserScheduleRow[])
      .reduce<UpcomingSchedule[]>((acc, assignment) => {
        const schedule = firstRelation(assignment.schedules);
        const event = schedule ? firstRelation(schedule.events) : null;
        const role = firstRelation(assignment.ministry_roles);

        if (!schedule || !event || !role) return acc;

        acc.push({
          id: assignment.id,
          schedule_id: assignment.schedule_id,
          role_id: assignment.role_id,
          status: assignment.status,
          role_name: role.name,
          event: {
            id: event.id,
            title: event.title,
            start_at: event.start_at,
            location: event.location,
            description: event.description,
          }
        });

        return acc;
      }, [])
      .sort((a, b) => new Date(a.event.start_at).getTime() - new Date(b.event.start_at).getTime());

    return { data: formattedData, error: null };
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error('Erro ao buscar escalas do usuário:', message);
    return { data: null, error: message };
  }
}

export async function getUpcomingAllSchedules() {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select(`
        id,
        ministry_id,
        event_id,
        events!inner (
          id,
          title,
          start_at,
          location,
          description
        ),
        schedule_assignments (
          id,
          user_id,
          role_id,
          status,
          ministry_roles (
            name
          ),
          profiles (
            full_name
          )
        )
      `)
      .order('id');

    if (error) throw error;
    
    if (!data) return { data: [], error: null };

    const now = new Date().getTime();
    
    // Mapear para o formato UpcomingSchedule simplificado ou similar
    // Como aqui temos MÚLTIPLOS assignments por schedule, vamos achatar ou adaptar
    const formattedData: UpcomingSchedule[] = [];
    
    (data as UpcomingAllScheduleRow[]).forEach((schedule) => {
      const event = firstRelation(schedule.events);
      if (!event) return;

      const eventTime = new Date(event.start_at).getTime();
      if (eventTime < now) return;

      // Se não houver assignments, mostramos a vaga vazia ou o slot
      if (schedule.schedule_assignments.length === 0) {
        formattedData.push({
          id: `empty-${schedule.id}`,
          schedule_id: schedule.id,
          role_id: '',
          status: 'vago',
          role_name: 'Vaga Disponível',
          event: {
            id: event.id,
            title: event.title,
            start_at: event.start_at,
            location: event.location,
            description: event.description,
          }
        });
      } else {
        schedule.schedule_assignments.forEach((assignment) => {
          const role = firstRelation(assignment.ministry_roles);
          const profile = firstRelation(assignment.profiles);

          formattedData.push({
            id: assignment.id,
            schedule_id: schedule.id,
            role_id: assignment.role_id,
            status: assignment.status,
            role_name: `${role?.name || 'Membro'} - ${profile?.full_name || 'N/A'}`,
            event: {
              id: event.id,
              title: event.title,
              start_at: event.start_at,
              location: event.location,
              description: event.description,
            }
          });
        });
      }
    });

    return { data: formattedData, error: null };
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error('Erro ao buscar todas as escalas:', message);
    return { data: null, error: message };
  }
}

export async function getManageableScheduleCards(
  userId: string,
  ministryIds?: string[],
) {
  try {
    let query = supabase
      .from('schedules')
      .select(`
        id,
        created_at,
        ministry_id,
        event_id,
        events!inner (
          id,
          title,
          start_at,
          location,
          description
        ),
        ministries!inner (
          id,
          name
        ),
        schedule_assignments (
          id,
          user_id,
          role_id,
          status,
          ministry_roles (
            name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (ministryIds && ministryIds.length > 0) {
      query = query.in('ministry_id', ministryIds);
    }

    const { data, error } = await query;

    if (error) throw error;

    const cards = ((data ?? []) as ScheduleCardManageableRow[])
      .reduce<ScheduleCard[]>((acc, row) => {
        const event = firstRelation(row.events);
        const ministry = firstRelation(row.ministries);

        if (!event || !ministry) return acc;

        acc.push({
          id: row.id,
          created_at: row.created_at,
          event: {
            id: event.id,
            title: event.title,
            start_at: event.start_at,
            location: event.location,
            description: event.description,
          },
          ministry: {
            id: ministry.id,
            name: ministry.name,
          },
          team: countAssignmentsByStatus(row.schedule_assignments),
          my_assignments: (row.schedule_assignments ?? [])
            .filter((assignment) => assignment.user_id === userId)
            .map((assignment) => ({
              id: assignment.id,
              role_id: assignment.role_id,
              role_name:
                firstRelation(assignment.ministry_roles)?.name ?? "Função",
              status: assignment.status,
            })),
          can_manage: true,
        });

        return acc;
      }, [])
      .sort(compareScheduleCardsByDate);

    return { data: cards, error: null };
  } catch (error: unknown) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getUserScheduleCards(userId: string) {
  try {
    const { data, error } = await supabase
      .from('schedule_assignments')
      .select(`
        id,
        schedule_id,
        role_id,
        status,
        ministry_roles (
          name
        ),
        schedules!inner (
          id,
          created_at,
          event_id,
          ministry_id,
          events!inner (
            id,
            title,
            start_at,
            location,
            description
          ),
          ministries!inner (
            id,
            name
          ),
          schedule_assignments (
            id,
            status
          )
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;

    const grouped = new Map<string, ScheduleCard>();

    ((data ?? []) as ScheduleCardMemberRow[]).forEach((row) => {
      const schedule = firstRelation(row.schedules);
      const event = schedule ? firstRelation(schedule.events) : null;
      const ministry = schedule ? firstRelation(schedule.ministries) : null;
      const role = firstRelation(row.ministry_roles);

      if (!schedule || !event || !ministry || !role) return;

      if (!grouped.has(schedule.id)) {
        grouped.set(schedule.id, {
          id: schedule.id,
          created_at: schedule.created_at,
          event: {
            id: event.id,
            title: event.title,
            start_at: event.start_at,
            location: event.location,
            description: event.description,
          },
          ministry: {
            id: ministry.id,
            name: ministry.name,
          },
          team: countAssignmentsByStatus(schedule.schedule_assignments),
          my_assignments: [],
          can_manage: false,
        });
      }

      grouped.get(schedule.id)?.my_assignments.push({
        id: row.id,
        role_id: row.role_id,
        role_name: role.name,
        status: row.status,
      });
    });

    return {
      data: Array.from(grouped.values()).sort(compareScheduleCardsByDate),
      error: null,
    };
  } catch (error: unknown) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getScheduleDetails(scheduleId: string) {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select(`
        id,
        event_id,
        ministry_id,
        created_at,
        events!inner (
          id,
          title,
          start_at,
          end_at,
          location,
          description,
          is_public
        ),
        ministries!inner (
          id,
          name,
          color
        )
      `)
      .eq('id', scheduleId)
      .single<ScheduleDetailsRow>();

    if (error) throw error;

    const event = firstRelation(data.events);
    const ministry = firstRelation(data.ministries);

    if (!event || !ministry) {
      throw new Error('Nao foi possivel carregar o contexto da escala.');
    }

    return {
      data: {
        id: data.id,
        event_id: data.event_id,
        ministry_id: data.ministry_id,
        created_at: data.created_at,
        event: {
          id: event.id,
          title: event.title,
          start_at: event.start_at,
          end_at: event.end_at,
          location: event.location,
          description: event.description,
          is_public: event.is_public,
        },
        ministry: {
          id: ministry.id,
          name: ministry.name,
          color: ministry.color,
        },
      },
      error: null,
    };
  } catch (error: unknown) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function deleteSchedule(scheduleId: string) {
  try {
    const scheduleCtx = await getScheduleContext(scheduleId);
    if (scheduleCtx.error || !scheduleCtx.data || !scheduleCtx.data.event) {
      throw new Error(scheduleCtx.error ?? "Escala nao encontrada.");
    }

    if (isEventDateReadOnly(scheduleCtx.data.event.start_at)) {
      throw new Error("Evento/escala nao e mais editavel no dia do evento ou depois dele.");
    }

    const { error } = await supabase
      .from("schedules")
      .delete()
      .eq("id", scheduleId);

    if (error) throw error;

    return { error: null };
  } catch (error: unknown) {
    return { error: getErrorMessage(error) };
  }
}

export async function removeScheduleAssignment(assignmentId: string) {
  try {
    const assignmentCtx = await getAssignmentScheduleContext(assignmentId);
    if (assignmentCtx.error || !assignmentCtx.data?.event) {
      throw new Error(assignmentCtx.error ?? "Assignment nao encontrado.");
    }

    if (isEventDateReadOnly(assignmentCtx.data.event.start_at)) {
      throw new Error("Nao e mais possivel alterar a equipe no dia do evento ou depois dele.");
    }

    const { error } = await supabase
      .from('schedule_assignments')
      .delete()
      .eq('id', assignmentId);

    if (error) throw error;

    return { error: null };
  } catch (error: unknown) {
    return { error: getErrorMessage(error) };
  }
}

export async function confirmMyAssignmentsForSchedule(input: {
  scheduleId: string;
  userId: string;
}) {
  try {
    const scheduleCtx = await getScheduleContext(input.scheduleId);
    if (scheduleCtx.error || !scheduleCtx.data || !scheduleCtx.data.event) {
      throw new Error(scheduleCtx.error ?? "Escala nao encontrada.");
    }

    if (isEventDateReadOnly(scheduleCtx.data.event.start_at)) {
      throw new Error("A escala nao permite confirmar presenca no dia do evento ou depois dele.");
    }

    const { error } = await supabase
      .from("schedule_assignments")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
      })
      .eq("schedule_id", input.scheduleId)
      .eq("user_id", input.userId)
      .eq("status", "pending");

    if (error) throw error;

    return { error: null };
  } catch (error: unknown) {
    return { error: getErrorMessage(error) };
  }
}

export async function confirmAssignmentsByIds(input: {
  assignmentIds: string[];
  userId: string;
}) {
  try {
    if (input.assignmentIds.length === 0) {
      return { error: null };
    }

    const { error } = await supabase
      .from("schedule_assignments")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
      })
      .eq("user_id", input.userId)
      .in("id", input.assignmentIds);

    if (error) throw error;

    return { error: null };
  } catch (error: unknown) {
    return { error: getErrorMessage(error) };
  }
}

export async function getAssignmentsByEvent(eventId: string): Promise<{ data: AssignmentWithDetails[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('schedule_assignments')
      .select(`
        id,
        schedule_id,
        user_id,
        role_id,
        status,
        schedules!inner (
          event_id
        ),
        ministry_roles (
          name,
          ministries (
            name
          )
        ),
        profiles (
          full_name,
          avatar_url
        )
      `)
      // Filtra pelo event_id via o join !inner — forma robusta para PostgREST
      .eq('schedules.event_id', eventId);

    if (error) throw error;
    // Cast via unknown: PostgREST infere arrays nos joins, interface reflete isso corretamente
    return { data: (data as unknown) as AssignmentWithDetails[], error: null };
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error('Erro ao buscar escalados do evento:', message);
    return { data: null, error: message };
  }
}

export async function validateScheduleAssignmentIntegrity(
  scheduleId: string,
  userId: string,
  roleId: string,
): Promise<AssignmentIntegrityValidation> {
  const scheduleCtx = await getScheduleContext(scheduleId);
  if (scheduleCtx.error || !scheduleCtx.data || !scheduleCtx.data.event) {
    return {
      isValid: false,
      isEventEditable: false,
      isRoleFromScheduleMinistry: false,
      isUserMemberOfScheduleMinistry: false,
      doesUserHaveCapability: false,
      error: scheduleCtx.error ?? 'Escala nao encontrada.',
    };
  }

  const isEventEditable = !isEventDateReadOnly(scheduleCtx.data.event.start_at);
  if (!isEventEditable) {
    return {
      isValid: false,
      isEventEditable: false,
      isRoleFromScheduleMinistry: false,
      isUserMemberOfScheduleMinistry: false,
      doesUserHaveCapability: false,
      error: 'Evento/escala nao e mais editavel no dia do evento ou depois dele.',
    };
  }

  const roleResult = await supabase
    .from('ministry_roles')
    .select('id, ministry_id')
    .eq('id', roleId)
    .single();

  if (roleResult.error || !roleResult.data) {
    return {
      isValid: false,
      isEventEditable: true,
      isRoleFromScheduleMinistry: false,
      isUserMemberOfScheduleMinistry: false,
      doesUserHaveCapability: false,
      error: roleResult.error?.message ?? 'Funcao nao encontrada.',
    };
  }

  const isRoleFromScheduleMinistry =
    roleResult.data.ministry_id === scheduleCtx.data.ministry_id;

  if (!isRoleFromScheduleMinistry) {
    return {
      isValid: false,
      isEventEditable: true,
      isRoleFromScheduleMinistry: false,
      isUserMemberOfScheduleMinistry: false,
      doesUserHaveCapability: false,
      error: 'A funcao selecionada nao pertence ao ministerio da escala.',
    };
  }

  const memberResult = await supabase
    .from('ministry_members')
    .select('id')
    .eq('ministry_id', scheduleCtx.data.ministry_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (memberResult.error) {
    return {
      isValid: false,
      isEventEditable: true,
      isRoleFromScheduleMinistry: true,
      isUserMemberOfScheduleMinistry: false,
      doesUserHaveCapability: false,
      error: memberResult.error.message,
    };
  }

  if (!memberResult.data) {
    return {
      isValid: false,
      isEventEditable: true,
      isRoleFromScheduleMinistry: true,
      isUserMemberOfScheduleMinistry: false,
      doesUserHaveCapability: false,
      error: 'O usuario nao pertence ao ministerio da escala.',
    };
  }

  const isUserMemberOfScheduleMinistry = true;
  const memberId = memberResult.data.id;

  const capabilityResult = await supabase
    .from('ministry_member_roles')
    .select('id')
    .eq('member_id', memberId)
    .eq('role_id', roleId)
    .maybeSingle();

  if (capabilityResult.error) {
    return {
      isValid: false,
      isEventEditable: true,
      isRoleFromScheduleMinistry: true,
      isUserMemberOfScheduleMinistry: true,
      doesUserHaveCapability: false,
      error: capabilityResult.error.message,
    };
  }

  const doesUserHaveCapability = !!capabilityResult.data;

  if (!doesUserHaveCapability) {
    return {
      isValid: false,
      isEventEditable: true,
      isRoleFromScheduleMinistry: true,
      isUserMemberOfScheduleMinistry: true,
      doesUserHaveCapability: false,
      error: 'O usuario nao possui capability para a funcao selecionada.',
    };
  }

  return {
    isValid: true,
    isEventEditable: true,
    isRoleFromScheduleMinistry: true,
    isUserMemberOfScheduleMinistry: true,
    doesUserHaveCapability: true,
    error: null,
  };
}

export async function createSwapRequest(input: {
  fromAssignmentId: string;
  toUserId?: string | null;
  reason?: string | null;
}) {
  try {
    const { data, error } = await supabase
      .from("swap_requests")
      .insert([
        {
          from_assignment_id: input.fromAssignmentId,
          to_user_id: input.toUserId ?? null,
          reason: input.reason?.trim() ? input.reason.trim() : null,
        },
      ])
      .select("id,from_assignment_id,to_assignment_id,to_user_id,reason,status,reviewed_by,created_at,updated_at")
      .single<TableRow<"swap_requests">>();

    if (error) throw error;

    return { data, error: null };
  } catch (error: unknown) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getVisibleSwapRequests(
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled',
) {
  try {
    let query = supabase
      .from('swap_requests')
      .select(
        'id,from_assignment_id,to_assignment_id,to_user_id,reason,status,reviewed_by,created_at,updated_at',
      )
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data ?? []) as SwapRequestRow[];
    if (rows.length === 0) {
      return { data: [] as SwapRequestReviewItem[], error: null };
    }

    const fromAssignmentIds = rows.map((row) => row.from_assignment_id);
    const profileIds = Array.from(
      new Set(
        rows
          .flatMap((row) => [row.to_user_id, row.reviewed_by])
          .filter((value): value is string => !!value),
      ),
    );

    const [assignmentResult, profileResult] = await Promise.all([
      supabase
        .from('schedule_assignments')
        .select(
          `
          id,
          schedule_id,
          user_id,
          role_id,
          status,
          profiles (
            full_name,
            avatar_url
          ),
          ministry_roles (
            name
          ),
          schedules!inner (
            ministry_id,
            event_id,
            events!inner (
              id,
              title,
              start_at
            ),
            ministries!inner (
              id,
              name
            )
          )
        `,
        )
        .in('id', fromAssignmentIds),
      profileIds.length > 0
        ? supabase.from('profiles').select('id,full_name').in('id', profileIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (assignmentResult.error) throw assignmentResult.error;
    if (profileResult.error) throw profileResult.error;

    const assignmentMap = new Map(
      ((assignmentResult.data ?? []) as SwapAssignmentContextRow[]).map((row) => [row.id, row]),
    );
    const profileMap = new Map(
      ((profileResult.data ?? []) as SwapProfileRow[]).map((row) => [row.id, row]),
    );

    const mapped = rows.map<SwapRequestReviewItem>((row) => {
      const assignment = assignmentMap.get(row.from_assignment_id) ?? null;
      const assignmentProfile = assignment?.profiles ? firstRelation(assignment.profiles) : null;
      const assignmentRole = assignment?.ministry_roles
        ? firstRelation(assignment.ministry_roles)
        : null;
      const assignmentSchedule = assignment?.schedules
        ? firstRelation(assignment.schedules)
        : null;
      const assignmentEvent = assignmentSchedule?.events
        ? firstRelation(assignmentSchedule.events)
        : null;
      const assignmentMinistry = assignmentSchedule?.ministries
        ? firstRelation(assignmentSchedule.ministries)
        : null;
      const targetUser = row.to_user_id ? profileMap.get(row.to_user_id) ?? null : null;
      const reviewer = row.reviewed_by ? profileMap.get(row.reviewed_by) ?? null : null;

      return {
        id: row.id,
        status: row.status,
        reason: row.reason,
        created_at: row.created_at,
        updated_at: row.updated_at,
        from_assignment:
          assignment && assignmentSchedule && assignmentEvent && assignmentMinistry
            ? {
                id: assignment.id,
                schedule_id: assignment.schedule_id,
                user_id: assignment.user_id,
                member_name: assignmentProfile?.full_name ?? 'Membro',
                role_name: assignmentRole?.name ?? 'Funcao',
                ministry_id: assignmentSchedule.ministry_id,
                ministry_name: assignmentMinistry.name,
                event_id: assignmentEvent.id,
                event_title: assignmentEvent.title,
                event_start_at: assignmentEvent.start_at,
              }
            : null,
        to_user: targetUser
          ? {
              id: targetUser.id,
              full_name: targetUser.full_name ?? 'Membro',
            }
          : null,
        reviewed_by: reviewer
          ? {
              id: reviewer.id,
              full_name: reviewer.full_name ?? 'Usuario',
            }
          : null,
      };
    });

    return { data: mapped, error: null };
  } catch (error: unknown) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function acceptSwapRequest(requestId: string) {
  try {
    const { data, error } = await supabase
      .rpc('accept_swap_request', {
        p_swap_request_id: requestId,
      });

    if (error) throw error;

    return { data, error: null };
  } catch (error: unknown) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function cancelOwnSwapRequest(requestId: string) {
  try {
    const { data, error } = await supabase
      .rpc('cancel_own_swap_request', {
        p_swap_request_id: requestId,
      });

    if (error) throw error;

    return { data, error: null };
  } catch (error: unknown) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getSwapCandidatesForAssignment(assignmentId: string) {
  try {
    const { data: assignment, error: assignmentError } = await supabase
      .from('schedule_assignments')
      .select(
        `
        id,
        user_id,
        role_id,
        schedules!inner (
          ministry_id
        )
      `,
      )
      .eq('id', assignmentId)
      .single<{
        id: string;
        user_id: string;
        role_id: string;
        schedules:
          | {
              ministry_id: string;
            }
          | {
              ministry_id: string;
            }[];
      }>();

    if (assignmentError) throw assignmentError;

    const schedule = firstRelation(assignment.schedules);
    if (!schedule) {
      throw new Error('Contexto da escala nao encontrado.');
    }

    const { data, error } = await supabase
      .from('ministry_members')
      .select(
        `
        user_id,
        profiles!inner (
          full_name,
          avatar_url
        ),
        ministry_member_roles!inner (
          role_id
        )
      `,
      )
      .eq('ministry_id', schedule.ministry_id)
      .eq('ministry_member_roles.role_id', assignment.role_id)
      .neq('user_id', assignment.user_id);

    if (error) throw error;

    const mapped: SwapCandidateOption[] = ((data ?? []) as {
      user_id: string;
      profiles:
        | {
            full_name: string | null;
            avatar_url: string | null;
          }
        | {
            full_name: string | null;
            avatar_url: string | null;
          }[]
        | null;
    }[]).map((row) => {
      const profile = firstRelation(row.profiles);
      return {
        user_id: row.user_id,
        full_name: profile?.full_name ?? 'Membro',
        avatar_url: profile?.avatar_url ?? null,
      };
    });

    return { data: mapped, error: null };
  } catch (error: unknown) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getOwnPendingSwapRequestForAssignments(assignmentIds: string[]) {
  try {
    if (assignmentIds.length === 0) {
      return { data: null as PendingOwnSwapRequest | null, error: null };
    }

    const { data, error } = await supabase
      .from('swap_requests')
      .select('id,from_assignment_id,reason,created_at')
      .in('from_assignment_id', assignmentIds)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    return {
      data: ((data ?? [])[0] as PendingOwnSwapRequest | undefined) ?? null,
      error: null,
    };
  } catch (error: unknown) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getOwnPendingSwapRequestsForAssignments(assignmentIds: string[]) {
  try {
    if (assignmentIds.length === 0) {
      return { data: [] as PendingOwnSwapRequest[], error: null };
    }

    const { data, error } = await supabase
      .from('swap_requests')
      .select('id,from_assignment_id,reason,created_at')
      .in('from_assignment_id', assignmentIds)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      data: (data ?? []) as PendingOwnSwapRequest[],
      error: null,
    };
  } catch (error: unknown) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export interface ScheduleCardAssignmentSummary {
  id: string;
  role_id: string;
  role_name: string;
  status: AssignmentStatus;
}

export interface ScheduleCard {
  id: string;
  created_at: string;
  event: {
    id: string;
    title: string;
    start_at: string;
    location: string | null;
    description: string | null;
  };
  ministry: {
    id: string;
    name: string;
  };
  team: {
    total: number;
    pending: number;
    confirmed: number;
  };
  my_assignments: ScheduleCardAssignmentSummary[];
  can_manage: boolean;
}

export interface SwapRequestReviewItem {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reason: string | null;
  created_at: string;
  updated_at: string;
  from_assignment: {
    id: string;
    schedule_id: string;
    user_id: string;
    member_name: string;
    role_name: string;
    ministry_id: string;
    ministry_name: string;
    event_id: string;
    event_title: string;
    event_start_at: string;
  } | null;
  to_user: {
    id: string;
    full_name: string;
  } | null;
  reviewed_by: {
    id: string;
    full_name: string;
  } | null;
}

export interface SwapCandidateOption {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

export interface PendingOwnSwapRequest {
  id: string;
  from_assignment_id: string;
  reason: string | null;
  created_at: string;
}

export interface ScheduleDetails {
  id: string;
  event_id: string;
  ministry_id: string;
  created_at: string;
  event: {
    id: string;
    title: string;
    start_at: string;
    end_at: string | null;
    location: string | null;
    description: string | null;
    is_public: boolean;
  };
  ministry: {
    id: string;
    name: string;
    color: string | null;
  };
}

export async function createScheduleValidated(input: {
  eventId: string;
  ministryId: string;
}) {
  try {
    const editability = await isEventEditableById(input.eventId);
    if (editability.error) throw new Error(editability.error);
    if (!editability.editable) {
      throw new Error('Evento/escala nao e mais editavel no dia do evento ou depois dele.');
    }

    const { data, error } = await supabase
      .from('schedules')
      .upsert(
        [
          {
            event_id: input.eventId,
            ministry_id: input.ministryId,
          },
        ],
        { onConflict: 'event_id,ministry_id' },
      )
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error: unknown) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function upsertScheduleAssignmentValidated(input: {
  scheduleId: string;
  userId: string;
  roleId: string;
  status?: 'pending' | 'confirmed' | 'declined' | 'swapped';
}) {
  try {
    const validation = await validateScheduleAssignmentIntegrity(
      input.scheduleId,
      input.userId,
      input.roleId,
    );

    if (!validation.isValid) {
      throw new Error(validation.error ?? 'Assignment invalido para esta escala.');
    }

    const { data, error } = await supabase
      .from('schedule_assignments')
      .upsert(
        [
          {
            schedule_id: input.scheduleId,
            user_id: input.userId,
            role_id: input.roleId,
            status: input.status ?? 'pending',
          },
        ],
        {
          onConflict: 'schedule_id,user_id,role_id',
        },
      )
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error: unknown) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getAssignmentWarningsForSchedule(input: {
  scheduleId: string;
  userId: string;
}): Promise<{ data: AssignmentWarning[] | null; error: string | null }> {
  try {
    const scheduleCtx = await getScheduleContext(input.scheduleId);
    if (scheduleCtx.error || !scheduleCtx.data || !scheduleCtx.data.event) {
      throw new Error(scheduleCtx.error ?? 'Escala nao encontrada.');
    }

    const warnings: AssignmentWarning[] = [];

    // Blocked date warning (calendar day)
    const eventDate = toISODateString(scheduleCtx.data.event.start_at);
    const blocked = await supabase
      .from('blocked_dates')
      .select('id,date')
      .eq('user_id', input.userId)
      .eq('date', eventDate)
      .maybeSingle();

    if (blocked.error) throw blocked.error;
    if (blocked.data) {
      warnings.push({ type: 'blocked_date', date: eventDate });
    }

    // Conflict warnings (soft, warning only)
    const targetStart = new Date(scheduleCtx.data.event.start_at);
    const targetEnd = scheduleCtx.data.event.end_at
      ? new Date(scheduleCtx.data.event.end_at)
      : new Date(scheduleCtx.data.event.start_at);

    const { data, error } = await supabase
      .from('schedule_assignments')
      .select(`
        id,
        status,
        schedules!inner (
          id,
          event_id,
          ministries (
            name
          ),
          events!inner (
            id,
            title,
            start_at,
            end_at
          )
        ),
        ministry_roles (
          name
        )
      `)
      .eq('user_id', input.userId)
      .neq('status', 'declined');

    if (error) throw error;

    ((data ?? []) as ConflictQueryRow[]).forEach((row) => {
      const joinedSchedule = firstRelation(row.schedules);
      const joinedEvent = joinedSchedule?.events
        ? firstRelation(joinedSchedule.events)
        : null;

      if (!joinedEvent) return;
      if (joinedEvent.id === scheduleCtx.data!.event!.id) return;

      const otherStart = new Date(joinedEvent.start_at);
      const otherEnd = joinedEvent.end_at ? new Date(joinedEvent.end_at) : otherStart;

      if (!rangesOverlap(otherStart, otherEnd, targetStart, targetEnd)) return;

      const ministry = joinedSchedule?.ministries
        ? firstRelation(joinedSchedule.ministries)
        : null;
      const role = row.ministry_roles
        ? firstRelation(row.ministry_roles)
        : null;

      warnings.push({
        type: 'conflict',
        event_id: joinedEvent.id,
        event_title: joinedEvent.title,
        ministry_name: ministry?.name ?? null,
        role_name: role?.name ?? null,
        start_at: joinedEvent.start_at,
        end_at: joinedEvent.end_at ?? null,
      });
    });

    return { data: warnings, error: null };
  } catch (error: unknown) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getScheduleByEventAndMinistry(eventId: string, ministryId: string) {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('id,event_id,ministry_id,created_at')
      .eq('event_id', eventId)
      .eq('ministry_id', ministryId)
      .maybeSingle();

    if (error) throw error;
    return { data, error: null };
  } catch (error: unknown) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getMinistryRolesOptions(ministryId: string) {
  try {
    const { data, error } = await supabase
      .from('ministry_roles')
      .select('id,ministry_id,name')
      .eq('ministry_id', ministryId)
      .order('name', { ascending: true });

    if (error) throw error;
    return { data: (data ?? []) as MinistryRoleOption[], error: null };
  } catch (error: unknown) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getMinistryMembersOptions(ministryId: string) {
  try {
    const { data, error } = await supabase
      .from('ministry_members')
      .select(`
        user_id,
        profiles!inner (
          full_name,
          avatar_url
        ),
        ministry_member_roles (
          role_id
        )
      `)
      .eq('ministry_id', ministryId);

    if (error) throw error;

    const formatted: MinistryMemberOption[] = ((data ?? []) as MinistryMemberOptionRow[]).map((row) => {
      const profile = firstRelation(row.profiles);

      return {
        user_id: row.user_id,
        full_name: profile?.full_name ?? 'Membro',
        avatar_url: profile?.avatar_url ?? null,
        capability_role_ids: (row.ministry_member_roles ?? []).map((role) => role.role_id),
      };
    });

    return { data: formatted, error: null };
  } catch (error: unknown) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getScheduleAssignmentsDetailed(scheduleId: string) {
  try {
    const { data, error } = await supabase
      .from('schedule_assignments')
      .select(`
        id,
        user_id,
        role_id,
        status,
        profiles (
          full_name,
          avatar_url
        ),
        ministry_roles (
          name
        )
      `)
      .eq('schedule_id', scheduleId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const formatted: ScheduleAssignmentDetailed[] = ((data ?? []) as ScheduleAssignmentDetailedRow[]).map((row) => {
      const profile = firstRelation(row.profiles);
      const role = firstRelation(row.ministry_roles);

      return {
        id: row.id,
        user_id: row.user_id,
        role_id: row.role_id,
        status: row.status,
        member_name: profile?.full_name ?? 'Membro',
        role_name: role?.name ?? 'Funcao',
      };
    });

    return { data: formatted, error: null };
  } catch (error: unknown) {
    return { data: null, error: getErrorMessage(error) };
  }
}



