import { supabase } from '../lib/supabase';
import { UserProfile } from '../types/models';
import { mapSearchableUsers, type SearchableUserLike } from '../utils/ministryMappers';
import { getGenericUserFacingError, getRawErrorMessage } from '../utils/userFacingErrors';

export interface SearchableProfile {
  id: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
  role: 'admin' | 'leader' | 'member';
}

export interface EventPermissionProfile extends SearchableProfile {
  can_manage_events: boolean;
}

interface ListProfilesPageOptions {
  query?: string;
  page?: number;
  pageSize?: number;
  excludeRoles?: SearchableProfile['role'][];
}

interface EventPermissionProfileLike extends SearchableUserLike {
  can_manage_events?: boolean | null;
}

function getErrorMessage(error: unknown) {
  return getRawErrorMessage(error) || 'Erro inesperado.';
}

function normalizeUserProfile(data: Partial<UserProfile> | null) {
  if (!data) {
    return null;
  }

  return {
    ...data,
    can_manage_events: data.can_manage_events === true,
  } as UserProfile;
}

function buildProfilesPageRpcArgs(
  {
    query = '',
    page = 0,
    pageSize = 10,
    excludeRoles = [],
  }: ListProfilesPageOptions,
) {
  const normalizedQuery = query.trim();
  const safePage = Math.max(0, page);
  const safePageSize = Math.max(1, pageSize);

  return {
    args: {
      p_query: normalizedQuery,
      p_limit: safePageSize + 1,
      p_offset: safePage * safePageSize,
      p_excluded_roles: excludeRoles,
    },
    safePageSize,
  };
}

function mapEventPermissionProfiles(rows: EventPermissionProfileLike[]) {
  const baseProfiles = mapSearchableUsers(rows);

  return baseProfiles.map((profile, index) => ({
    ...profile,
    can_manage_events: rows[index]?.can_manage_events === true,
  })) as EventPermissionProfile[];
}

function toSearchableUserRows(data: unknown) {
  return ((data ?? []) as Partial<SearchableUserLike>[]).map((row) => ({
    id: row.id ?? '',
    full_name: row.full_name ?? null,
    email: row.email ?? null,
    avatar_url: row.avatar_url ?? null,
    role: row.role ?? 'member',
  })) as SearchableUserLike[];
}

function toEventPermissionProfileRows(data: unknown) {
  return (data ?? []) as unknown as EventPermissionProfileLike[];
}

export async function getProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { profile: normalizeUserProfile(data as Partial<UserProfile> | null), error: null };
  } catch (error: unknown) {
    console.error('Erro ao buscar perfil:', getRawErrorMessage(error));
    return {
      profile: null,
      error: getGenericUserFacingError(
        error,
        'Nao foi possivel carregar seu perfil. Tente novamente em alguns instantes.',
      ),
    };
  }
}

export async function updateProfile(userId: string, updates: Partial<UserProfile>) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;
    return { error: null };
  } catch (error: unknown) {
    console.error('Erro ao atualizar perfil:', getRawErrorMessage(error));
    return {
      error: getGenericUserFacingError(
        error,
        'Nao foi possivel salvar seu perfil. Tente novamente em alguns instantes.',
      ),
    };
  }
}

interface SearchProfilesOptions {
  excludeRoles?: SearchableProfile['role'][];
}

export async function searchProfiles(
  query: string,
  options: SearchProfilesOptions = {},
) {
  const result = await listProfilesPage({
    query,
    page: 0,
    pageSize: 30,
    excludeRoles: options.excludeRoles,
  });

  return {
    data: result.data,
    error: result.error,
  };
}

export async function listProfilesPage({
  query = '',
  page = 0,
  pageSize = 10,
  excludeRoles = [],
}: ListProfilesPageOptions) {
  try {
    const { args, safePageSize } = buildProfilesPageRpcArgs({
      query,
      page,
      pageSize,
      excludeRoles,
    });

    const { data, error } = await supabase.rpc(
      'search_visible_profiles',
      args,
    );

    if (error) throw error;

    const mappedProfiles = mapSearchableUsers(
      toSearchableUserRows(data),
    ) as SearchableProfile[];

    return {
      data: mappedProfiles.slice(0, safePageSize),
      hasMore: mappedProfiles.length > safePageSize,
      error: null,
    };
  } catch (error: unknown) {
    return {
      data: null,
      hasMore: false,
      error: getGenericUserFacingError(
        error,
        'Nao foi possivel carregar os perfis. Tente novamente em alguns instantes.',
      ),
    };
  }
}

export async function listProfilesForEventPermissionPage(
  options: ListProfilesPageOptions,
) {
  try {
    const { args, safePageSize } = buildProfilesPageRpcArgs(options);

    const { data, error } = await supabase.rpc(
      'list_profiles_for_event_permissions',
      args,
    );

    if (error) throw error;

    const mappedProfiles = mapEventPermissionProfiles(
      toEventPermissionProfileRows(data),
    );

    return {
      data: mappedProfiles.slice(0, safePageSize),
      hasMore: mappedProfiles.length > safePageSize,
      error: null,
    };
  } catch (error: unknown) {
    return {
      data: null,
      hasMore: false,
      error: getGenericUserFacingError(
        error,
        'Nao foi possivel carregar os perfis. Tente novamente em alguns instantes.',
      ),
    };
  }
}

export async function getProfilesByIds(userIds: string[]) {
  try {
    if (userIds.length === 0) {
      return { data: [] as SearchableProfile[], error: null };
    }

    const { data, error } = await supabase.rpc(
      'get_visible_profiles_by_ids',
      {
        p_user_ids: userIds,
      },
    );

    if (error) throw error;

    const profiles = mapSearchableUsers(toSearchableUserRows(data)) as SearchableProfile[];
    const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));

    return {
      data: userIds.map((userId) => profilesById.get(userId)).filter((profile): profile is SearchableProfile => !!profile),
      error: null,
    };
  } catch (error: unknown) {
    return {
      data: null,
      error: getGenericUserFacingError(
        error,
        'Nao foi possivel carregar os perfis. Tente novamente em alguns instantes.',
      ),
    };
  }
}

export async function setProfileEventManagementPermission(
  userId: string,
  canManageEvents: boolean,
) {
  try {
    const { data, error } = await supabase.rpc(
      'set_profile_event_management_permission',
      {
        p_user_id: userId,
        p_can_manage_events: canManageEvents,
      },
    );

    if (error) throw error;

    return {
      data: mapEventPermissionProfiles([
        (data ?? null) as EventPermissionProfileLike,
      ])[0] ?? null,
      error: null,
    };
  } catch (error: unknown) {
    return {
      data: null,
      error: getGenericUserFacingError(
        error,
        'Nao foi possivel atualizar esta permissao. Tente novamente em alguns instantes.',
      ),
    };
  }
}
