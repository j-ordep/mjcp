import { supabase } from '../lib/supabase';
import { Event } from '../types/models';
import { normalizeAudienceUserIds } from '../utils/eventAudience';
import { normalizeEventRange } from '../utils/eventDate';
import { normalizeEventCategory } from '../utils/eventCategory';
import { getGenericUserFacingError, getRawErrorMessage } from '../utils/userFacingErrors';
import {
  getLinkedReservationForEvent,
  mapRoomReservationConflictMessage,
} from './roomReservationService';

export interface EventEditorData {
  event: Event;
  visible_to_user_ids: string[];
}

function buildEventPayload(eventData: Partial<Event>) {
  const { visible_to_user_ids: _ignoredVisibleUserIds, ...payload } = eventData;
  return payload;
}

async function fetchEvents(limit: number, upcomingOnly: boolean) {
  try {
    let query = supabase
      .from('events')
      .select('*');

    if (upcomingOnly) {
      query = query.gte('end_at', new Date().toISOString());
    }

    const { data, error } = await query
      .order('start_at', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return { data: data as Event[], error: null };
  } catch (error: unknown) {
    console.error(
      upcomingOnly ? 'Erro ao buscar proximos eventos:' : 'Erro ao buscar eventos:',
      getRawErrorMessage(error),
    );
    return {
      data: null,
      error: getGenericUserFacingError(
        error,
        'Nao foi possivel carregar os eventos. Tente novamente em alguns instantes.',
      ),
    };
  }
}

export async function getUpcomingEvents(limit: number = 20) {
  return fetchEvents(limit, true);
}

export async function getEvents(limit: number = 100) {
  return fetchEvents(limit, false);
}

export async function getEventById(eventId: string) {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) throw error;

    return { data: data as Event, error: null };
  } catch (error: unknown) {
    console.error('Erro ao buscar evento por id:', getRawErrorMessage(error));
    return {
      data: null,
      error: getGenericUserFacingError(
        error,
        'Nao foi possivel carregar este evento. Tente novamente em alguns instantes.',
      ),
    };
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
    console.error('Erro ao buscar audiencia do evento:', getRawErrorMessage(error));
    return {
      data: null,
      error: getGenericUserFacingError(
        error,
        'Nao foi possivel carregar a audiencia do evento. Tente novamente em alguns instantes.',
      ),
    };
  }
}

export async function getEventEditorData(eventId: string) {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) throw error;

    const event = data as Event;
    if (event.is_public !== false) {
      return {
        data: {
          event,
          visible_to_user_ids: [],
        } as EventEditorData,
        error: null,
      };
    }

    const audienceResult = await getEventAudienceUserIds(eventId);
    if (audienceResult.error) {
      throw new Error(audienceResult.error);
    }

    return {
      data: {
        event,
        visible_to_user_ids: audienceResult.data ?? [],
      } as EventEditorData,
      error: null,
    };
  } catch (error: unknown) {
    console.error('Erro ao buscar dados de edicao do evento:', getRawErrorMessage(error));
    return {
      data: null,
      error: getGenericUserFacingError(
        error,
        'Nao foi possivel carregar os dados do evento. Tente novamente em alguns instantes.',
      ),
    };
  }
}

export async function createMultipleEvents(eventsData: Partial<Event>[]) {
  try {
    const normalizedEvents = eventsData.map((eventData) => {
      const visibleUserIds = normalizeAudienceUserIds(eventData.visible_to_user_ids);
      const isPublic = eventData.is_public !== false;

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

    const { data, error } = await supabase.rpc(
      'create_events_with_audiences',
      {
        p_events: normalizedEvents.map((eventData) => ({
          ...buildEventPayload(eventData),
          visible_to_user_ids:
            eventData.is_public === false
              ? eventData.visible_to_user_ids ?? []
              : [],
        })),
      },
    );

    if (error) throw error;
    return { data: data as Event[], error: null };
  } catch (error: unknown) {
    console.error('Erro ao criar eventos em massa:', getRawErrorMessage(error));
    return {
      data: null,
      error: getGenericUserFacingError(
        error,
        'Nao foi possivel criar os eventos. Tente novamente em alguns instantes.',
      ),
    };
  }
}

export async function saveEventWithOptionalRoom(input: {
  eventId?: string;
  event: Partial<Event>;
  roomId?: string | null;
}) {
  try {
    let currentEventData: EventEditorData | null = null;
    let currentRoomId: string | null = null;

    if (input.eventId) {
      const [editorDataResult, linkedReservationResult] = await Promise.all([
        getEventEditorData(input.eventId),
        getLinkedReservationForEvent(input.eventId),
      ]);

      if (editorDataResult.error || !editorDataResult.data) {
        throw new Error(
          editorDataResult.error ?? 'Evento nao encontrado para salvar alteracoes.',
        );
      }

      if (linkedReservationResult.error) {
        throw new Error(linkedReservationResult.error);
      }

      currentEventData = editorDataResult.data;
      currentRoomId = linkedReservationResult.data?.room_id ?? null;
    }

    const effectiveTitle = input.event.title ?? currentEventData?.event.title;
    const effectiveCategory =
      input.event.category ?? currentEventData?.event.category;
    const effectiveDescription =
      input.event.description !== undefined
        ? input.event.description
        : currentEventData?.event.description ?? null;
    const effectiveLocation =
      input.event.location !== undefined
        ? input.event.location
        : currentEventData?.event.location ?? null;
    const effectiveStartAt =
      input.event.start_at ?? currentEventData?.event.start_at;
    const effectiveEndAt =
      input.event.end_at !== undefined
        ? input.event.end_at
        : currentEventData?.event.end_at ?? null;
    const effectiveIsPublic =
      input.event.is_public !== undefined
        ? input.event.is_public
        : currentEventData?.event.is_public ?? true;
    const effectiveVisibleUserIds =
      input.event.visible_to_user_ids !== undefined
        ? normalizeAudienceUserIds(input.event.visible_to_user_ids)
        : currentEventData?.visible_to_user_ids ?? [];
    const effectiveRoomId =
      input.roomId !== undefined ? input.roomId : currentRoomId;

    if (!effectiveTitle) {
      throw new Error('Titulo do evento e obrigatorio.');
    }

    if (!effectiveStartAt) {
      throw new Error('Data inicial invalida.');
    }

    const normalizedRange = normalizeEventRange({
      startAt: effectiveStartAt,
      endAt: effectiveEndAt,
      requireFutureStart:
        !input.eventId ||
        input.event.start_at !== undefined ||
        input.event.end_at !== undefined,
    });

    if (normalizedRange.error || !normalizedRange.data) {
      throw new Error(normalizedRange.error ?? 'Intervalo do evento invalido.');
    }

    const { data, error } = await supabase.rpc(
      'save_event_with_optional_room_reservation',
      {
        p_event_id: input.eventId ?? null,
        p_title: effectiveTitle,
        p_category: normalizeEventCategory(effectiveCategory),
        p_description: effectiveDescription,
        p_location: effectiveLocation,
        p_start_at: normalizedRange.data.startAt,
        p_end_at: normalizedRange.data.endAt,
        p_is_public: effectiveIsPublic !== false,
        p_visible_user_ids: effectiveVisibleUserIds,
        p_room_id: effectiveRoomId ?? null,
      },
    );

    if (error) throw error;

    return { data: data as Event, error: null };
  } catch (error: unknown) {
    const message = mapRoomReservationConflictMessage(error);
    console.error('Erro ao salvar evento com sala opcional:', message);
    return { data: null, error: message };
  }
}
