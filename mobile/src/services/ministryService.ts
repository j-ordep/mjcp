import { supabase } from "../lib/supabase";
import { Ministry } from "../types/models";

export interface UserMinistry extends Ministry {
  is_leader: boolean;
  joined_at: string;
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

    const formattedData: UserMinistry[] = data.map((m: any) => ({
      ...m.ministries,
      is_leader: m.is_leader,
      joined_at: m.joined_at,
    }));

    return { data: formattedData, error: null };
  } catch (error: any) {
    console.error("Erro ao buscar ministérios do usuário:", error.message);
    return { data: null, error: error.message };
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

    return { data: data as Ministry[], error: null };
  } catch (error: any) {
    console.error("Erro ao buscar todos os ministérios:", error.message);
    return { data: null, error: error.message };
  }
}
