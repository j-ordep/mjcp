export interface RelationRoleLike {
  id: string;
  name: string;
}

export interface RelationProfileLike {
  full_name: string | null;
  email?: string | null;
  avatar_url: string | null;
}

export interface MinistryMemberCapabilityLike {
  role_id: string;
  ministry_roles: RelationRoleLike | RelationRoleLike[] | null;
}

export interface MinistryMemberDetailedLike {
  id: string;
  ministry_id: string;
  user_id: string;
  is_leader: boolean;
  joined_at: string;
  profiles: RelationProfileLike | RelationProfileLike[] | null;
  ministry_member_roles: MinistryMemberCapabilityLike[] | null;
}

export interface UserMinistryLike {
  is_leader: boolean;
  joined_at: string;
  ministries:
    | {
        id: string;
        name: string;
        description: string | null;
        color: string | null;
      }
    | {
        id: string;
        name: string;
        description: string | null;
        color: string | null;
      }[]
    | null;
}

export interface SearchableUserLike {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: "admin" | "leader" | "member";
}

export function firstRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function mapMinistryMemberWithCapabilities(
  row: MinistryMemberDetailedLike,
) {
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
    .filter((role): role is { id: string; name: string } => !!role);

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

export function mapUserMinistries(rows: UserMinistryLike[]) {
  return rows.map((membership) => {
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
}

export function mapSearchableUsers(rows: SearchableUserLike[]) {
  return rows.map((row) => ({
    id: row.id,
    full_name: row.full_name ?? "Usuário",
    email: row.email,
    avatar_url: row.avatar_url,
    role: row.role,
  }));
}

export function extractAssignmentIds(rows: { id: string }[]) {
  return rows.map((assignment) => assignment.id);
}
