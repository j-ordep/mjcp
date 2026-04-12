import type { AssignmentStatus } from "../types/database.types";
import { firstRelation } from "./ministryMappers";
import { countAssignmentsByStatus } from "./scheduleRules";

export interface ScheduleCardLike {
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
  my_assignments: {
    id: string;
    role_id: string;
    role_name: string;
    status: AssignmentStatus;
  }[];
  can_manage: boolean;
}

export interface ManageableScheduleCardRowLike {
  id: string;
  created_at: string;
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
      }[]
    | null;
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
        ministry_roles: { name: string } | { name: string }[] | null;
      }[]
    | null;
}

export interface UserScheduleCardRowLike {
  id: string;
  schedule_id: string;
  role_id: string;
  status: AssignmentStatus;
  ministry_roles: { name: string } | { name: string }[] | null;
  schedules:
    | {
        id: string;
        created_at: string;
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

export function compareScheduleCardsByDate(a: ScheduleCardLike, b: ScheduleCardLike) {
  return new Date(a.event.start_at).getTime() - new Date(b.event.start_at).getTime();
}

export function mapManageableScheduleCards(
  rows: ManageableScheduleCardRowLike[],
  userId: string,
): ScheduleCardLike[] {
  return rows
    .reduce<ScheduleCardLike[]>((acc, row) => {
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
            role_name: firstRelation(assignment.ministry_roles)?.name ?? "Função",
            status: assignment.status,
          })),
        can_manage: true,
      });

      return acc;
    }, [])
    .sort(compareScheduleCardsByDate);
}

export function mapUserScheduleCards(rows: UserScheduleCardRowLike[]): ScheduleCardLike[] {
  const grouped = new Map<string, ScheduleCardLike>();

  rows.forEach((row) => {
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

  return Array.from(grouped.values()).sort(compareScheduleCardsByDate);
}
