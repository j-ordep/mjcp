import { supabase } from "../lib/supabase";
import { getAuthUserFacingError, getRawErrorMessage } from "../utils/userFacingErrors";

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
  } catch (error: unknown) {
    console.error("Erro no signUp:", getRawErrorMessage(error));
    return { user: null, error: getAuthUserFacingError(error, "sign_up") };
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
  } catch (error: unknown) {
    console.error("Erro no signIn:", getRawErrorMessage(error));
    return { user: null, error: getAuthUserFacingError(error, "sign_in") };
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) throw error;
    
    return { error: null };
  } catch (error: unknown) {
    console.error("Erro no signOut:", getRawErrorMessage(error));
    return { error: getAuthUserFacingError(error, "sign_out") };
  }
}
