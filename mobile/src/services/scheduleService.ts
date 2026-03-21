import { supabase } from '../lib/supabase';

export interface UpcomingSchedule {
  id: string; // assignment_id
  schedule_id: string;
  role_id: string;
  status: string;
  role_name: string;
  event: {
    id: string;
    title: string;
    start_at: string;
    location: string | null;
    description: string | null;
  };
}

/** Shape do retorno de getAssignmentsByEvent — tipagem explícita, sem `any`.
 * NOTA: PostgREST retorna joins como arrays mesmo em relações 1:1.
 * O mapeamento para o shape limpo acontece nos componentes consumidores.
 */
export interface AssignmentWithDetails {
  id: string;
  user_id: string;
  role_id: string;
  status: 'pending' | 'confirmed' | 'declined' | 'swapped';
  ministry_roles: {
    name: string;
    ministries: { name: string }[] | null;
  }[] | null;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  }[] | null;
}

export async function getUpcomingUserSchedules(userId: string) {
  try {
    const { data, error } = await supabase
      .from('schedule_assignments')
      .select(`
        id,
        schedule_id,
        role_id,
        status,
        schedules!inner (
          event_id,
          events!inner (
            id,
            title,
            start_at,
            location,
            description
          )
        ),
        ministry_roles!inner (
          name
        )
      `)
      .eq('user_id', userId)
      // #11 Filtro de eventos futuros feito na query para evitar tráfego desnecessário
      .gte('schedules.events.start_at', new Date().toISOString());

    if (error) throw error;
    
    if (!data) return { data: [], error: null };

    const formattedData: UpcomingSchedule[] = data
      .map((a: any) => ({
        id: a.id,
        schedule_id: a.schedule_id,
        role_id: a.role_id,
        status: a.status,
        role_name: a.ministry_roles.name,
        event: {
          id: a.schedules.events.id,
          title: a.schedules.events.title,
          start_at: a.schedules.events.start_at,
          location: a.schedules.events.location,
          description: a.schedules.events.description,
        }
      }))
      .sort((a, b) => new Date(a.event.start_at).getTime() - new Date(b.event.start_at).getTime());

    return { data: formattedData, error: null };
  } catch (error: any) {
    console.error('Erro ao buscar escalas do usuário:', error.message);
    return { data: null, error: error.message };
  }
}

export async function getUpcomingAllSchedules() {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select(`
        id,
        ministry_id,
        event_id,
        events!inner (
          id,
          title,
          start_at,
          location,
          description
        ),
        schedule_assignments (
          id,
          user_id,
          role_id,
          status,
          ministry_roles (
            name
          ),
          profiles (
            full_name
          )
        )
      `)
      .order('id');

    if (error) throw error;
    
    if (!data) return { data: [], error: null };

    const now = new Date().getTime();
    
    // Mapear para o formato UpcomingSchedule simplificado ou similar
    // Como aqui temos MÚLTIPLOS assignments por schedule, vamos achatar ou adaptar
    const formattedData: UpcomingSchedule[] = [];
    
    data.forEach((s: any) => {
      const eventTime = new Date(s.events.start_at).getTime();
      if (eventTime < now) return;

      // Se não houver assignments, mostramos a vaga vazia ou o slot
      if (s.schedule_assignments.length === 0) {
        formattedData.push({
          id: `empty-${s.id}`,
          schedule_id: s.id,
          role_id: '',
          status: 'vago',
          role_name: 'Vaga Disponível',
          event: {
            id: s.events.id,
            title: s.events.title,
            start_at: s.events.start_at,
            location: s.events.location,
            description: s.events.description,
          }
        });
      } else {
        s.schedule_assignments.forEach((a: any) => {
          formattedData.push({
            id: a.id,
            schedule_id: s.id,
            role_id: a.role_id,
            status: a.status,
            role_name: `${a.ministry_roles?.name || 'Membro'} - ${a.profiles?.full_name || 'N/A'}`,
            event: {
              id: s.events.id,
              title: s.events.title,
              start_at: s.events.start_at,
              location: s.events.location,
              description: s.events.description,
            }
          });
        });
      }
    });

    return { data: formattedData, error: null };
  } catch (error: any) {
    console.error('Erro ao buscar todas as escalas:', error.message);
    return { data: null, error: error.message };
  }
}

export async function getAssignmentsByEvent(eventId: string): Promise<{ data: AssignmentWithDetails[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('schedule_assignments')
      .select(`
        id,
        user_id,
        role_id,
        status,
        schedules!inner (
          event_id
        ),
        ministry_roles (
          name,
          ministries (
            name
          )
        ),
        profiles (
          full_name,
          avatar_url
        )
      `)
      // Filtra pelo event_id via o join !inner — forma robusta para PostgREST
      .eq('schedules.event_id', eventId);

    if (error) throw error;
    // Cast via unknown: PostgREST infere arrays nos joins, interface reflete isso corretamente
    return { data: (data as unknown) as AssignmentWithDetails[], error: null };
  } catch (error: any) {
    console.error('Erro ao buscar escalados do evento:', error.message);
    return { data: null, error: error.message };
  }
}

// TODO: Implementar createScheduleAssignment para Líderes/Admin (ver scheduling_model.md seção 3)