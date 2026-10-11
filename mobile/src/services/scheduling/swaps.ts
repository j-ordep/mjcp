import { supabase } from "../../lib/supabase";
import { firstRelation } from "../../utils/ministryMappers";
import type { TableRow } from "../../types/database.types";
import type {
  VisibleProfile,
  SwapRequestRow,
  SwapAssignmentContextRow,
  SwapRequestReviewItem,
  SwapCandidateOption,
  PendingOwnSwapRequest,
} from "../../types/scheduling";
import { getVisibleProfileMap, getErrorMessage } from "./context";

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

    const assignmentResult = await supabase
      .from('schedule_assignments')
      .select(
        `
        id,
        schedule_id,
        user_id,
        role_id,
        status,
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
      .in('id', fromAssignmentIds);

    if (assignmentResult.error) throw assignmentResult.error;

    const assignmentRows = (assignmentResult.data ?? []) as SwapAssignmentContextRow[];
    const profileResult = await getVisibleProfileMap([
      ...profileIds,
      ...assignmentRows.map((assignment) => assignment.user_id),
    ]);
    if (profileResult.error) throw new Error(profileResult.error);

    const assignmentMap = new Map(
      assignmentRows.map((row) => [row.id, row]),
    );
    const profileMap = profileResult.data ?? new Map<string, VisibleProfile>();

    const mapped = rows.map<SwapRequestReviewItem>((row) => {
      const assignment = assignmentMap.get(row.from_assignment_id) ?? null;
      const assignmentProfile = assignment
        ? profileMap.get(assignment.user_id) ?? null
        : null;
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
        ministry_member_roles!inner (
          role_id
        )
      `,
      )
      .eq('ministry_id', schedule.ministry_id)
      .eq('ministry_member_roles.role_id', assignment.role_id)
      .neq('user_id', assignment.user_id);

    if (error) throw error;

    const candidates = (data ?? []) as { user_id: string }[];
    const profileResult = await getVisibleProfileMap(
      candidates.map((candidate) => candidate.user_id),
    );
    if (profileResult.error) throw new Error(profileResult.error);

    const mapped: SwapCandidateOption[] = candidates.map((row) => {
      const profile = profileResult.data?.get(row.user_id) ?? null;
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
