import { supabase } from '../lib/supabase';
import type { AssignmentStatus, TableRow } from '../types/database.types';

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

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Erro inesperado.';
}

function firstRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function isEventDateEditable(startAtIso: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const eventDate = new Date(startAtIso);
  eventDate.setHours(0, 0, 0, 0);

  return eventDate.getTime() >= today.getTime();
}

function toISODateString(dateIso: string) {
  // Uses device local timezone; business rule is "editable until event date" (calendar day).
  const d = new Date(dateIso);
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart.getTime() < bEnd.getTime() && aEnd.getTime() > bStart.getTime();
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

    return { editable: isEventDateEditable(data.start_at), error: null };
  } catch (error: unknown) {
    return { editable: false, error: getErrorMessage(error) };
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

export async function getAssignmentsByEvent(eventId: string): Promise<{ data: AssignmentWithDetails[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('schedule_assignments')
      .select(`
        id,
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
      error: scheduleCtx.error ?? 'Escala nao encontrada.',
    };
  }

  const isEventEditable = isEventDateEditable(scheduleCtx.data.event.start_at);
  if (!isEventEditable) {
    return {
      isValid: false,
      isEventEditable: false,
      isRoleFromScheduleMinistry: false,
      isUserMemberOfScheduleMinistry: false,
      error: 'Evento/escala nao e mais editavel apos o dia do evento.',
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
      error: memberResult.error.message,
    };
  }

  const isUserMemberOfScheduleMinistry = !!memberResult.data;

  if (!isUserMemberOfScheduleMinistry) {
    return {
      isValid: false,
      isEventEditable: true,
      isRoleFromScheduleMinistry: true,
      isUserMemberOfScheduleMinistry: false,
      error: 'O usuario nao pertence ao ministerio da escala.',
    };
  }

  return {
    isValid: true,
    isEventEditable: true,
    isRoleFromScheduleMinistry: true,
    isUserMemberOfScheduleMinistry: true,
    error: null,
  };
}

export async function createScheduleValidated(input: {
  eventId: string;
  ministryId: string;
  notes?: string | null;
}) {
  try {
    const editability = await isEventEditableById(input.eventId);
    if (editability.error) throw new Error(editability.error);
    if (!editability.editable) {
      throw new Error('Evento/escala nao e mais editavel apos o dia do evento.');
    }

    const { data, error } = await supabase
      .from('schedules')
      .upsert(
        [
          {
            event_id: input.eventId,
            ministry_id: input.ministryId,
            notes: input.notes ?? null,
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
      .select('id,event_id,ministry_id,notes,created_at')
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
