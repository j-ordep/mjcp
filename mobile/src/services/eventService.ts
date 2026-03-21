import { supabase } from '../lib/supabase';
import { Event } from '../types/models';

export async function getUpcomingEvents(limit: number = 20) {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('end_at', new Date().toISOString())
      .order('start_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    
    return { data: data as Event[], error: null };
  } catch (error: any) {
    console.error('Erro ao buscar próximos eventos:', error.message);
    return { data: null, error: error.message };
  }
}

export async function createEvent(eventData: Partial<Event>) {
  try {
    const { data, error } = await supabase
      .from('events')
      .insert([
        {
          ...eventData,
          start_at: eventData.start_at || new Date().toISOString(),
          end_at: eventData.end_at || new Date(Date.now() + 3600000).toISOString(), // +1 hour default
        }
      ])
      .select()
      .single();

    if (error) throw error;
    
    return { data: data as Event, error: null };
  } catch (error: any) {
    console.error('Erro ao criar evento:', error.message);
    return { data: null, error: error.message };
  }
}

export async function createMultipleEvents(eventsData: Partial<Event>[]) {
  try {
    const { data, error } = await supabase
      .from('events')
      .insert(eventsData)
      .select();

    if (error) throw error;
    
    return { data: data as Event[], error: null };
  } catch (error: any) {
    console.error('Erro ao criar eventos em massa:', error.message);
    return { data: null, error: error.message };
  }
}

export async function updateEvent(eventId: string, updates: Partial<Event>) {
  try {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;
    
    return { data: data as Event, error: null };
  } catch (error: any) {
    console.error('Erro ao atualizar evento:', error.message);
    return { data: null, error: error.message };
  }
}
