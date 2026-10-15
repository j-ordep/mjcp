import { supabase } from "../../lib/supabase";
import { firstRelation } from "../../utils/ministryMappers";
import { isEventDateReadOnly, rangesOverlap, toISODateString } from "../../utils/scheduleRules";
import type {
  AssignmentIntegrityValidation,
  AssignmentWarning,
  ConflictQueryRow,
} from "../../types/scheduling";
import {
  getErrorMessage,
  getScheduleContext,
  isEventEditableById,
  getAssignmentScheduleContext,
} from "./context";

export async function deleteSchedule(scheduleId: string) {
  try {
    const scheduleCtx = await getScheduleContext(scheduleId);
    if (scheduleCtx.error || !scheduleCtx.data || !scheduleCtx.data.event) {
      throw new Error(scheduleCtx.error ?? "Escala nao encontrada.");
    }

    if (isEventDateReadOnly(scheduleCtx.data.event.start_at)) {
      throw new Error("Evento/escala nao e mais editavel no horario do evento ou depois dele.");
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
      throw new Error("Nao e mais possivel alterar a equipe no horario do evento ou depois dele.");
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
      throw new Error("A escala nao permite confirmar presenca no horario do evento ou depois dele.");
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
      error: 'Evento/escala nao e mais editavel no horario do evento ou depois dele.',
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

  const existingAssignmentResult = await supabase
    .from('schedule_assignments')
    .select('id')
    .eq('schedule_id', scheduleId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingAssignmentResult.error) {
    return {
      isValid: false,
      isEventEditable: true,
      isRoleFromScheduleMinistry: true,
      isUserMemberOfScheduleMinistry: true,
      doesUserHaveCapability: true,
      error: existingAssignmentResult.error.message,
    };
  }

  if (existingAssignmentResult.data) {
    return {
      isValid: false,
      isEventEditable: true,
      isRoleFromScheduleMinistry: true,
      isUserMemberOfScheduleMinistry: true,
      doesUserHaveCapability: true,
      error: 'Membro ja esta escalado nesta escala.',
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

export async function createScheduleValidated(input: {
  eventId: string;
  ministryId: string;
}) {
  try {
    const editability = await isEventEditableById(input.eventId);
    if (editability.error) throw new Error(editability.error);
    if (!editability.editable) {
      throw new Error('Evento/escala nao e mais editavel no horario do evento ou depois dele.');
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
