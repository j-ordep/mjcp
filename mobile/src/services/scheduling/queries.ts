import { supabase } from "../../lib/supabase";
import { firstRelation } from "../../utils/ministryMappers";
import {
  mapManageableScheduleCards,
  mapUserScheduleCards,
  type ManageableScheduleCardRowLike,
  type UserScheduleCardRowLike,
} from "../../utils/scheduleCardMappers";
import type {
  MinistryRoleOption,
  MinistryMemberOption,
  ScheduleAssignmentDetailed,
  ScheduleDetailsRow,
  MinistryMemberOptionRow,
  ScheduleAssignmentDetailedRow,
} from "../../types/scheduling";
import { getVisibleProfileMap, getErrorMessage } from "./context";

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

    const cards = mapManageableScheduleCards(
      (data ?? []) as ManageableScheduleCardRowLike[],
      userId,
    );

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

    return {
      data: mapUserScheduleCards((data ?? []) as UserScheduleCardRowLike[]),
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
        ministry_member_roles (
          role_id
        )
      `)
      .eq('ministry_id', ministryId);

    if (error) throw error;

    const members = (data ?? []) as MinistryMemberOptionRow[];
    const profileResult = await getVisibleProfileMap(
      members.map((member) => member.user_id),
    );
    if (profileResult.error) throw new Error(profileResult.error);

    const formatted: MinistryMemberOption[] = members.map((row) => {
      const profile = profileResult.data?.get(row.user_id) ?? null;

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
        ministry_roles (
          name
        )
      `)
      .eq('schedule_id', scheduleId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const assignments = (data ?? []) as ScheduleAssignmentDetailedRow[];
    const profileResult = await getVisibleProfileMap(
      assignments.map((assignment) => assignment.user_id),
    );
    if (profileResult.error) throw new Error(profileResult.error);

    const formatted: ScheduleAssignmentDetailed[] = assignments.map((row) => {
      const profile = profileResult.data?.get(row.user_id) ?? null;
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
