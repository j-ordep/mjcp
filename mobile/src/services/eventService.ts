import { supabase } from '../lib/supabase';
import { Event } from '../types/models';
import { normalizeEventRange } from '../utils/eventDate';
import { normalizeEventCategory } from '../utils/eventCategory';

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Erro inesperado.';
}

function normalizeVisibleUserIds(userIds: string[] | undefined) {
  return Array.from(
    new Set((userIds ?? []).map((userId) => userId.trim()).filter(Boolean)),
  );
}

function buildEventPayload(eventData: Partial<Event>) {
  const { visible_to_user_ids: _ignoredVisibleUserIds, ...payload } = eventData;
  return payload;
}

async function syncEventAudience(
  eventId: string,
  isPublic: boolean,
  visibleUserIds: string[],
) {
  const { error: deleteError } = await supabase
    .from('event_audiences')
    .delete()
    .eq('event_id', eventId);

  if (deleteError) throw deleteError;

  if (isPublic || visibleUserIds.length === 0) {
    return;
  }

  const { error: insertError } = await supabase
    .from('event_audiences')
    .insert(
      visibleUserIds.map((userId) => ({
        event_id: eventId,
        user_id: userId,
      })),
    );

  if (insertError) throw insertError;
}

function assertPrivateEventAudience(isPublic: boolean, visibleUserIds: string[]) {
  if (!isPublic && visibleUserIds.length === 0) {
    throw new Error('Selecione pelo menos um membro para evento privado.');
  }
}

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

export async function getEvents(limit: number = 100) {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_at', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return { data: data as Event[], error: null };
  } catch (error: any) {
    console.error('Erro ao buscar eventos:', error.message);
    return { data: null, error: error.message };
  }
}

export async function getEventAudienceUserIds(eventId: string) {
  try {
    const { data, error } = await supabase
      .from('event_audiences')
      .select('user_id')
      .eq('event_id', eventId);

    if (error) throw error;

    return {
      data: (data ?? []).map((row) => row.user_id as string),
      error: null,
    };
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error('Erro ao buscar audiencia do evento:', message);
    return { data: null, error: message };
  }
}

export async function createEvent(eventData: Partial<Event>) {
  try {
    const visibleUserIds = normalizeVisibleUserIds(eventData.visible_to_user_ids);
    const isPublic = eventData.is_public !== false;

    assertPrivateEventAudience(isPublic, visibleUserIds);

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
          ...buildEventPayload(eventData),
          category: normalizeEventCategory(eventData.category),
          is_public: isPublic,
          start_at: normalizedRange.data.startAt,
          end_at: normalizedRange.data.endAt,
        }
      ])
      .select()
      .single();

    if (error) throw error;

    if (!isPublic) {
      await syncEventAudience(data.id, false, visibleUserIds);
    }
    
    return { data: data as Event, error: null };
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error('Erro ao criar evento:', message);
    return { data: null, error: message };
  }
}

export async function createMultipleEvents(eventsData: Partial<Event>[]) {
  try {
    const normalizedEvents = eventsData.map((eventData) => {
      const visibleUserIds = normalizeVisibleUserIds(eventData.visible_to_user_ids);
      const isPublic = eventData.is_public !== false;

      assertPrivateEventAudience(isPublic, visibleUserIds);

      const normalizedRange = normalizeEventRange({
        startAt: eventData.start_at,
        endAt: eventData.end_at,
        requireFutureStart: true,
      });

      if (normalizedRange.error || !normalizedRange.data) {
        throw new Error(normalizedRange.error ?? 'Intervalo do evento invalido.');
      }

      return {
        ...buildEventPayload(eventData),
        category: normalizeEventCategory(eventData.category),
        is_public: isPublic,
        visible_to_user_ids: visibleUserIds,
        start_at: normalizedRange.data.startAt,
        end_at: normalizedRange.data.endAt,
      };
    });

    const { data, error } = await supabase
      .from('events')
      .insert(normalizedEvents.map((eventData) => buildEventPayload(eventData)))
      .select();

    if (error) throw error;

    const audienceRows = (data ?? []).flatMap((event, index) => {
      const normalizedEvent = normalizedEvents[index];
      if (!normalizedEvent || normalizedEvent.is_public !== false) {
        return [];
      }

      return (normalizedEvent.visible_to_user_ids ?? []).map((userId) => ({
        event_id: event.id,
        user_id: userId,
      }));
    });

    if (audienceRows.length > 0) {
      const { error: audienceError } = await supabase
        .from('event_audiences')
        .insert(audienceRows);

      if (audienceError) throw audienceError;
    }
    
    return { data: data as Event[], error: null };
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error('Erro ao criar eventos em massa:', message);
    return { data: null, error: message };
  }
}

export async function updateEvent(eventId: string, updates: Partial<Event>) {
  try {
    const payload = { ...buildEventPayload(updates) };
    const hasStartAt = Object.prototype.hasOwnProperty.call(updates, 'start_at');
    const hasEndAt = Object.prototype.hasOwnProperty.call(updates, 'end_at');
    const hasCategory = Object.prototype.hasOwnProperty.call(updates, 'category');
    const hasIsPublic = Object.prototype.hasOwnProperty.call(updates, 'is_public');
    const hasVisibleUserIds = Object.prototype.hasOwnProperty.call(
      updates,
      'visible_to_user_ids',
    );

    const visibleUserIds = normalizeVisibleUserIds(updates.visible_to_user_ids);
    let currentEvent:
      | Pick<Event, 'start_at' | 'is_public'>
      | null = null;

    const getCurrentEvent = async () => {
      if (currentEvent) return currentEvent;

      const { data, error } = await supabase
        .from('events')
        .select('start_at,is_public')
        .eq('id', eventId)
        .single();

      if (error) throw error;

      currentEvent = data as Pick<Event, 'start_at' | 'is_public'> | null;

      if (!currentEvent) {
        throw new Error('Evento nao encontrado para validar alteracoes.');
      }

      return currentEvent;
    };

    if (hasCategory) {
      payload.category = normalizeEventCategory(updates.category);
    }

    if (hasStartAt || hasEndAt) {
      let startAt = updates.start_at;

      if (!startAt && hasEndAt) {
        startAt = (await getCurrentEvent()).start_at;

        if (!startAt) {
          throw new Error('Evento nao encontrado para validar intervalo.');
        }
      }

      const normalizedRange = normalizeEventRange({
        startAt,
        endAt: updates.end_at,
        requireFutureStart: true,
      });

      if (normalizedRange.error || !normalizedRange.data) {
        throw new Error(normalizedRange.error ?? 'Intervalo do evento invalido.');
      }

      if (hasStartAt) {
        payload.start_at = normalizedRange.data.startAt;
      }
      payload.end_at = normalizedRange.data.endAt;
    }

    if (hasIsPublic || hasVisibleUserIds) {
      const effectiveIsPublic =
        updates.is_public ?? (await getCurrentEvent()).is_public;

      assertPrivateEventAudience(effectiveIsPublic !== false, visibleUserIds);
      payload.is_public = effectiveIsPublic;
    }

    const { data, error } = await supabase
      .from('events')
      .update(payload)
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;

    if (hasIsPublic || hasVisibleUserIds) {
      await syncEventAudience(
        eventId,
        payload.is_public !== false,
        visibleUserIds,
      );
    }
    
    return { data: data as Event, error: null };
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error('Erro ao atualizar evento:', message);
    return { data: null, error: message };
  }
}
