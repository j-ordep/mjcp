import { supabase } from '../lib/supabase';
import { Event } from '../types/models';
import { normalizeEventRange } from '../utils/eventDate';

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
    const normalizedRange = normalizeEventRange({
      startAt: eventData.start_at,
      endAt: eventData.end_at,
      requireFutureStart: true,
    });

    if (normalizedRange.error || !normalizedRange.data) {
      throw new Error(normalizedRange.error ?? 'Intervalo do evento invalido.');
    }

    const { data, error } = await supabase
      .from('events')
      .insert([
        {
          ...eventData,
          start_at: normalizedRange.data.startAt,
          end_at: normalizedRange.data.endAt,
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
    const normalizedEvents = eventsData.map((eventData) => {
      const normalizedRange = normalizeEventRange({
        startAt: eventData.start_at,
        endAt: eventData.end_at,
        requireFutureStart: true,
      });

      if (normalizedRange.error || !normalizedRange.data) {
        throw new Error(normalizedRange.error ?? 'Intervalo do evento invalido.');
      }

      return {
        ...eventData,
        start_at: normalizedRange.data.startAt,
        end_at: normalizedRange.data.endAt,
      };
    });

    const { data, error } = await supabase
      .from('events')
      .insert(normalizedEvents)
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
    const payload = { ...updates };

    if (updates.start_at || updates.end_at) {
      const normalizedRange = normalizeEventRange({
        startAt: updates.start_at,
        endAt: updates.end_at,
        requireFutureStart: true,
      });

      if (normalizedRange.error || !normalizedRange.data) {
        throw new Error(normalizedRange.error ?? 'Intervalo do evento invalido.');
      }

      payload.start_at = normalizedRange.data.startAt;
      payload.end_at = normalizedRange.data.endAt;
    }

    const { data, error } = await supabase
      .from('events')
      .update(payload)
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
