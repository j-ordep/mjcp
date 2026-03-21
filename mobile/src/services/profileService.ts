import { supabase } from '../lib/supabase';
import { UserProfile } from '../types/models';

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
