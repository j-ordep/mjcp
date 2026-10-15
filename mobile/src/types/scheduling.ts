import type { SupabaseRelation } from "../utils/ministryMappers";
import { type ScheduleCardLike } from "../utils/scheduleCardMappers";
import type { AssignmentStatus } from "./database.types";

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

export interface VisibleProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface ScheduleContext {
  id: string;
  ministry_id: string;
  event: {
    id: string;
    start_at: string;
    end_at: string | null;
  } | null;
}

export interface ScheduleContextRow {
  id: string;
  ministry_id: string;
  events:
  SupabaseRelation<{
    id: string;
    start_at: string;
    end_at: string | null;
  }>;
}

export interface ScheduleDetailsRow {
  id: string;
  event_id: string;
  ministry_id: string;
  created_at: string;
  events:
  SupabaseRelation<{
    id: string;
    title: string;
    start_at: string;
    end_at: string | null;
    location: string | null;
    description: string | null;
    is_public: boolean;
  }>;
  ministries:
  SupabaseRelation<{
    id: string;
    name: string;
    color: string | null;
  }>;
}

export interface ConflictQueryRow {
  id: string;
  status: AssignmentStatus;
  schedules:
  SupabaseRelation<{
    id: string;
    event_id: string;
    ministries: SupabaseRelation<{ name: string }>;
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
  }>;
  ministry_roles: SupabaseRelation<{ name: string }>;
}

export interface MinistryMemberOptionRow {
  user_id: string;
  profiles:
  SupabaseRelation<{
    full_name: string | null;
    avatar_url: string | null;
  }>;
  ministry_member_roles:
  | {
    role_id: string;
  }[]
  | null;
}

export interface ScheduleAssignmentDetailedRow {
  id: string;
  user_id: string;
  role_id: string;
  status: AssignmentStatus;
  profiles:
  SupabaseRelation<{
    full_name: string | null;
    avatar_url: string | null;
  }>;
  ministry_roles:
  SupabaseRelation<{
    name: string;
  }>;
}

export interface SwapRequestRow {
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

export interface SwapAssignmentContextRow {
  id: string;
  schedule_id: string;
  user_id: string;
  role_id: string;
  status: AssignmentStatus;
  profiles:
  SupabaseRelation<{
    full_name: string | null;
    avatar_url: string | null;
  }>;
  ministry_roles:
  SupabaseRelation<{
    name: string;
  }>;
  schedules:
  SupabaseRelation<{
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
    SupabaseRelation<{
      id: string;
      name: string;
    }>;
  }>;
}

export type ScheduleCard = ScheduleCardLike;

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
