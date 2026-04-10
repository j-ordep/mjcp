import { supabase } from "../lib/supabase";

export async function signUp(email: string, password: string, fullName: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });
    if (error) throw error;
    return { user: data.user, error: null };
  } catch (error: any) {
    console.error('Erro no signUp:', error.message);
    return { user: null, error: error.message };
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { user: data.user, error: null };
  } catch (error: any) {
    console.error('Erro no signIn:', error.message);
    return { user: null, error: error.message };
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) throw error;
    
    return { error: null };
  } catch (error: any) {
    console.error('Erro no signOut:', error.message);
    return { error: error.message };
  }
}