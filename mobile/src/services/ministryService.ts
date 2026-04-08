import { supabase } from "../lib/supabase";
import type { TableRow } from "../types/database.types";
import { Ministry } from "../types/models";

export interface UserMinistry extends Ministry {
  is_leader: boolean;
  joined_at: string;
}

export interface SearchableUser {
  id: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
  role: "admin" | "leader" | "member";
}

export interface MinistryCapabilityOption {
  id: string;
  name: string;
}

export interface MinistryMemberWithCapabilities {
  id: string;
  ministry_id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
  is_leader: boolean;
  joined_at: string;
  capability_role_ids: string[];
  capability_roles: MinistryCapabilityOption[];
}

interface UserMinistryRow {
  is_leader: boolean;
  joined_at: string;
  ministries:
    | {
        id: string;
        name: string;
        description: string | null;
        color: string | null;
        created_at: string;
      }
    | {
        id: string;
        name: string;
        description: string | null;
        color: string | null;
        created_at: string;
      }[];
}

interface SearchableUserRow {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: "admin" | "leader" | "member";
}

interface MinistryMemberCapabilityRow {
  role_id: string;
  ministry_roles:
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

interface MinistryMemberDetailedRow {
  id: string;
  ministry_id: string;
  user_id: string;
  is_leader: boolean;
  joined_at: string;
  profiles:
    | {
        full_name: string | null;
        email: string | null;
        avatar_url: string | null;
      }
    | {
        full_name: string | null;
        email: string | null;
        avatar_url: string | null;
      }[]
    | null;
  ministry_member_roles: MinistryMemberCapabilityRow[] | null;
}

function firstRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Erro inesperado.";
}

function mapMemberRow(row: MinistryMemberDetailedRow): MinistryMemberWithCapabilities {
  const profile = firstRelation(row.profiles);
  const capability_roles = (row.ministry_member_roles ?? [])
    .map((capabilityRow) => {
      const role = firstRelation(capabilityRow.ministry_roles);
      if (!role) return null;
      return {
        id: role.id,
        name: role.name,
      };
    })
    .filter((role): role is MinistryCapabilityOption => !!role);

  return {
    id: row.id,
    ministry_id: row.ministry_id,
    user_id: row.user_id,
    full_name: profile?.full_name ?? "Membro",
    email: profile?.email ?? null,
    avatar_url: profile?.avatar_url ?? null,
    is_leader: row.is_leader,
    joined_at: row.joined_at,
    capability_role_ids: capability_roles.map((role) => role.id),
    capability_roles,
  };
}

/**
 * Busca os ministérios de um usuário específico via junction table ministry_members
 */
export async function getUserMinistries(userId: string) {
  try {
    const { data, error } = await supabase
      .from("ministry_members")
      .select(
        `
        is_leader,
        joined_at,
        ministries!inner (
          id,
          name,
          description,
          color,
          created_at
        )
      `,
      )
      .eq("user_id", userId);

    if (error) throw error;

    const formattedData: UserMinistry[] = ((data ?? []) as UserMinistryRow[]).map((membership) => {
      const ministry = firstRelation(membership.ministries);

      return {
        id: ministry?.id ?? "",
        name: ministry?.name ?? "Ministério",
        description: ministry?.description ?? null,
        color: ministry?.color ?? "#000000",
        is_leader: membership.is_leader,
        joined_at: membership.joined_at,
      };
    });

    return { data: formattedData, error: null };
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error("Erro ao buscar ministérios do usuário:", message);
    return { data: null, error: message };
  }
}

/**
 * Busca todos os ministérios cadastrados na igreja (Admin/Líder view)
 */
export async function getAllMinistries() {
  try {
    const { data, error } = await supabase
      .from("ministries")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;

    return { data: (data ?? []) as Ministry[], error: null };
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error("Erro ao buscar todos os ministérios:", message);
    return { data: null, error: message };
  }
}

export async function searchRegisteredUsers(query: string) {
  try {
    const normalizedQuery = query.trim();
    let request = supabase
      .from("profiles")
      .select("id,full_name,email,avatar_url,role")
      .order("full_name", { ascending: true })
      .limit(30);

    if (normalizedQuery) {
      request = request.or(
        `full_name.ilike.%${normalizedQuery}%,email.ilike.%${normalizedQuery}%`,
      );
    }

    const { data, error } = await request;

    if (error) throw error;

    const users: SearchableUser[] = ((data ?? []) as SearchableUserRow[]).map((row) => ({
      id: row.id,
      full_name: row.full_name ?? "Usuário",
      email: row.email,
      avatar_url: row.avatar_url,
      role: row.role,
    }));

    return { data: users, error: null };
  } catch (error: unknown) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getMinistryMembersDetailed(ministryId: string) {
  try {
    const { data, error } = await supabase
      .from("ministry_members")
      .select(
        `
        id,
        ministry_id,
        user_id,
        is_leader,
        joined_at,
        profiles!inner (
          full_name,
          email,
          avatar_url
        ),
        ministry_member_roles (
          role_id,
          ministry_roles (
            id,
            name
          )
        )
      `,
      )
      .eq("ministry_id", ministryId)
      .order("joined_at", { ascending: true });

    if (error) throw error;

    return {
      data: ((data ?? []) as MinistryMemberDetailedRow[]).map(mapMemberRow),
      error: null,
    };
  } catch (error: unknown) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function addUserToMinistry(input: {
  ministryId: string;
  userId: string;
  isLeader?: boolean;
}) {
  try {
    const { data, error } = await supabase
      .from("ministry_members")
      .upsert(
        [
          {
            ministry_id: input.ministryId,
            user_id: input.userId,
            is_leader: input.isLeader ?? false,
          },
        ],
        { onConflict: "ministry_id,user_id" },
      )
      .select("id,ministry_id,user_id,is_leader,joined_at")
      .single<TableRow<"ministry_members">>();

    if (error) throw error;

    return { data, error: null };
  } catch (error: unknown) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function updateMinistryMemberLeaderStatus(memberId: string, isLeader: boolean) {
  try {
    const { data, error } = await supabase
      .from("ministry_members")
      .update({ is_leader: isLeader })
      .eq("id", memberId)
      .select("id,ministry_id,user_id,is_leader,joined_at")
      .single<TableRow<"ministry_members">>();

    if (error) throw error;

    return { data, error: null };
  } catch (error: unknown) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function removeUserFromMinistry(memberId: string) {
  try {
    const { error } = await supabase
      .from("ministry_members")
      .delete()
      .eq("id", memberId);

    if (error) throw error;

    return { error: null };
  } catch (error: unknown) {
    return { error: getErrorMessage(error) };
  }
}

export async function saveMinistryMemberCapabilities(memberId: string, roleIds: string[]) {
  try {
    const { error: deleteError } = await supabase
      .from("ministry_member_roles")
      .delete()
      .eq("member_id", memberId);

    if (deleteError) throw deleteError;

    if (roleIds.length === 0) {
      return { error: null };
    }

    const payload = roleIds.map((roleId) => ({
      member_id: memberId,
      role_id: roleId,
    }));

    const { error } = await supabase
      .from("ministry_member_roles")
      .insert(payload);

    if (error) throw error;

    return { error: null };
  } catch (error: unknown) {
    return { error: getErrorMessage(error) };
  }
}
