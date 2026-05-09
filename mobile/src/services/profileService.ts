import { supabase } from '../lib/supabase';
import { UserProfile } from '../types/models';
import { mapSearchableUsers, type SearchableUserLike } from '../utils/ministryMappers';

export interface SearchableProfile {
  id: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
  role: 'admin' | 'leader' | 'member';
}

interface ListProfilesPageOptions {
  query?: string;
  page?: number;
  pageSize?: number;
  excludeRoles?: SearchableProfile['role'][];
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Erro inesperado.';
}

export async function getProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { profile: data as UserProfile, error: null };
  } catch (error: any) {
    console.error('Erro ao buscar perfil:', error.message);
    return { profile: null, error: error.message };
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
  } catch (error: any) {
    console.error('Erro ao atualizar perfil:', error.message);
    return { error: error.message };
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
    const normalizedQuery = query.trim();
    const safePage = Math.max(0, page);
    const safePageSize = Math.max(1, pageSize);
    const from = safePage * safePageSize;
    const to = from + safePageSize;
    let request = supabase
      .from('profiles')
      .select('id,full_name,email,avatar_url,role')
      .order('full_name', { ascending: true })
      .range(from, to);

    for (const role of excludeRoles) {
      request = request.neq('role', role);
    }

    if (normalizedQuery) {
      request = request.or(
        `full_name.ilike.%${normalizedQuery}%,email.ilike.%${normalizedQuery}%`,
      );
    }

    const { data, error } = await request;

    if (error) throw error;

    const mappedProfiles = mapSearchableUsers(
      (data ?? []) as SearchableUserLike[],
    ) as SearchableProfile[];

    return {
      data: mappedProfiles.slice(0, safePageSize),
      hasMore: mappedProfiles.length > safePageSize,
      error: null,
    };
  } catch (error: unknown) {
    return { data: null, hasMore: false, error: getErrorMessage(error) };
  }
}

export async function getProfilesByIds(userIds: string[]) {
  try {
    if (userIds.length === 0) {
      return { data: [] as SearchableProfile[], error: null };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id,full_name,email,avatar_url,role')
      .in('id', userIds)
      .order('full_name', { ascending: true });

    if (error) throw error;

    const profiles = mapSearchableUsers((data ?? []) as SearchableUserLike[]) as SearchableProfile[];
    const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));

    return {
      data: userIds.map((userId) => profilesById.get(userId)).filter((profile): profile is SearchableProfile => !!profile),
      error: null,
    };
  } catch (error: unknown) {
    return { data: null, error: getErrorMessage(error) };
  }
}
