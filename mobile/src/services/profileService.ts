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

export async function searchProfiles(query: string) {
  try {
    const normalizedQuery = query.trim();
    let request = supabase
      .from('profiles')
      .select('id,full_name,email,avatar_url,role')
      .order('full_name', { ascending: true })
      .limit(30);

    if (normalizedQuery) {
      request = request.or(
        `full_name.ilike.%${normalizedQuery}%,email.ilike.%${normalizedQuery}%`,
      );
    }

    const { data, error } = await request;

    if (error) throw error;

    return {
      data: mapSearchableUsers((data ?? []) as SearchableUserLike[]) as SearchableProfile[],
      error: null,
    };
  } catch (error: unknown) {
    return { data: null, error: getErrorMessage(error) };
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
