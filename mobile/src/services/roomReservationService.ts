import { supabase } from "../lib/supabase";
import type { Room, RoomReservation } from "../types/models";
import { normalizeEventCategory } from "../utils/eventCategory";

export const ROOM_EVENT_LINKED_CANCELLATION_MESSAGE =
  "Esta reserva está vinculada a um evento e não pode ser cancelada por aqui.";

export const ROOM_RESERVATION_CONFLICT_MESSAGE =
  "Esta sala já está reservada para esse horário.";

const ROOM_AVAILABILITY_LOAD_ERROR_MESSAGE =
  "Não foi possível carregar as salas para esse horário.";
const ROOM_DAILY_AGENDA_LOAD_ERROR_MESSAGE =
  "Não foi possível carregar a agenda das salas.";
const ROOM_RESERVATION_CREATE_ERROR_MESSAGE =
  "Não foi possível salvar a reserva da sala.";
const ROOM_RESERVATION_CANCEL_ERROR_MESSAGE =
  "Não foi possível cancelar a reserva.";
const ROOM_EVENT_LINK_LOAD_ERROR_MESSAGE =
  "Não foi possível carregar a reserva vinculada ao evento.";

export interface RoomAvailability extends Room {
  status: "available" | "occupied";
  reservation: RoomReservation | null;
}

export interface LinkedRoomScheduleSummary {
  schedulesCount: number;
  assignmentsCount: number;
  confirmedAssignmentsCount: number;
  pendingAssignmentsCount: number;
}

export interface RoomDailyAgendaItem {
  id: string;
  roomId: string;
  startAt: string;
  endAt: string;
  purpose: string | null;
  category: RoomReservation["category"];
  eventId: string | null;
  isEventLinked: boolean;
  linkedScheduleSummary: LinkedRoomScheduleSummary | null;
}

export interface RoomDailyAgendaRoom extends Room {
  agenda: RoomDailyAgendaItem[];
}

interface ScheduleSummaryRow {
  id: string;
  event_id: string;
  schedule_assignments:
    | {
        id: string;
        status: "pending" | "confirmed" | "declined" | "swapped";
      }[]
    | null;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return "Erro inesperado.";
}

function mapRoomReservationError(error: unknown, fallback: string) {
  const message = getErrorMessage(error);

  if (message.includes("no_overlap")) {
    return ROOM_RESERVATION_CONFLICT_MESSAGE;
  }

  if (
    message === ROOM_EVENT_LINKED_CANCELLATION_MESSAGE ||
    message === ROOM_RESERVATION_CONFLICT_MESSAGE ||
    message === "Usuário não autenticado." ||
    message === "Reserva não encontrada." ||
    message === "Você não pode cancelar esta reserva." ||
    message === "Esta reserva já não está ativa." ||
    message === "Data inicial inválida." ||
    message === "Data final inválida." ||
    message === "Data inválida." ||
    message === "A data final deve ser maior que a data inicial." ||
    message === "Intervalo da reserva inválido."
  ) {
    return message;
  }

  return fallback;
}

function normalizeReservationWindow(input: {
  startAt?: string | null;
  endAt?: string | null;
}) {
  const startDate = input.startAt ? new Date(input.startAt) : null;
  const endDate = input.endAt ? new Date(input.endAt) : null;

  if (!startDate || Number.isNaN(startDate.getTime())) {
    return { data: null, error: "Data inicial inválida." };
  }

  if (!endDate || Number.isNaN(endDate.getTime())) {
    return { data: null, error: "Data final inválida." };
  }

  if (endDate.getTime() <= startDate.getTime()) {
    return {
      data: null,
      error: "A data final deve ser maior que a data inicial.",
    };
  }

  return {
    data: {
      startAt: startDate.toISOString(),
      endAt: endDate.toISOString(),
    },
    error: null,
  };
}

function normalizeDayWindow(dateKey: string) {
  const startDate = new Date(`${dateKey}T00:00:00`);

  if (Number.isNaN(startDate.getTime())) {
    return { data: null, error: "Data inválida." };
  }

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);

  return {
    data: {
      startAt: startDate.toISOString(),
      endAt: endDate.toISOString(),
    },
    error: null,
  };
}

function buildLinkedScheduleSummaryByEventId(rows: ScheduleSummaryRow[]) {
  const summaryByEventId = new Map<string, LinkedRoomScheduleSummary>();

  for (const row of rows) {
    const currentSummary = summaryByEventId.get(row.event_id) ?? {
      schedulesCount: 0,
      assignmentsCount: 0,
      confirmedAssignmentsCount: 0,
      pendingAssignmentsCount: 0,
    };

    currentSummary.schedulesCount += 1;

    for (const assignment of row.schedule_assignments ?? []) {
      currentSummary.assignmentsCount += 1;

      if (assignment.status === "confirmed") {
        currentSummary.confirmedAssignmentsCount += 1;
      }

      if (assignment.status === "pending") {
        currentSummary.pendingAssignmentsCount += 1;
      }
    }

    summaryByEventId.set(row.event_id, currentSummary);
  }

  return summaryByEventId;
}

export function mapRoomReservationConflictMessage(error: unknown) {
  return mapRoomReservationError(error, ROOM_RESERVATION_CREATE_ERROR_MESSAGE);
}

export async function getRoomsForWindow(input: {
  startAt: string;
  endAt: string;
}) {
  try {
    const normalizedWindow = normalizeReservationWindow(input);

    if (normalizedWindow.error || !normalizedWindow.data) {
      throw new Error(normalizedWindow.error ?? "Intervalo da reserva inválido.");
    }

    const { data: rooms, error: roomsError } = await supabase
      .from("rooms")
      .select("*")
      .order("name", { ascending: true });

    if (roomsError) throw roomsError;

    const { data: reservations, error: reservationsError } = await supabase
      .from("room_reservations")
      .select("*")
      .eq("status", "active")
      .lt("start_at", normalizedWindow.data.endAt)
      .gt("end_at", normalizedWindow.data.startAt)
      .order("start_at", { ascending: true });

    if (reservationsError) throw reservationsError;

    const reservationByRoomId = new Map<string, RoomReservation>();

    for (const reservation of (reservations ?? []) as RoomReservation[]) {
      if (!reservationByRoomId.has(reservation.room_id)) {
        reservationByRoomId.set(reservation.room_id, reservation);
      }
    }

    return {
      data: ((rooms ?? []) as Room[]).map((room) => {
        const reservation = reservationByRoomId.get(room.id) ?? null;

        return {
          ...room,
          status: reservation ? "occupied" : "available",
          reservation,
        };
      }) as RoomAvailability[],
      error: null,
    };
  } catch (error: unknown) {
    return {
      data: null,
      error: mapRoomReservationError(error, ROOM_AVAILABILITY_LOAD_ERROR_MESSAGE),
    };
  }
}

export async function getRoomsDailyAgenda(dateKey: string) {
  try {
    const normalizedDay = normalizeDayWindow(dateKey);

    if (normalizedDay.error || !normalizedDay.data) {
      throw new Error(normalizedDay.error ?? "Data inválida.");
    }

    const { data: rooms, error: roomsError } = await supabase
      .from("rooms")
      .select("*")
      .order("name", { ascending: true });

    if (roomsError) throw roomsError;

    const { data: reservations, error: reservationsError } = await supabase
      .from("room_reservations")
      .select("*")
      .eq("status", "active")
      .lt("start_at", normalizedDay.data.endAt)
      .gt("end_at", normalizedDay.data.startAt)
      .order("start_at", { ascending: true });

    if (reservationsError) throw reservationsError;

    const typedReservations = (reservations ?? []) as RoomReservation[];
    const eventIds = Array.from(
      new Set(
        typedReservations
          .map((reservation) => reservation.event_id)
          .filter(
            (eventId): eventId is string =>
              typeof eventId === "string" && eventId.length > 0,
          ),
      ),
    );

    let linkedScheduleSummaryByEventId = new Map<string, LinkedRoomScheduleSummary>();

    if (eventIds.length > 0) {
      const { data: schedules, error: schedulesError } = await supabase
        .from("schedules")
        .select(`
          id,
          event_id,
          schedule_assignments (
            id,
            status
          )
        `)
        .in("event_id", eventIds);

      if (!schedulesError) {
        linkedScheduleSummaryByEventId = buildLinkedScheduleSummaryByEventId(
          (schedules ?? []) as ScheduleSummaryRow[],
        );
      }
    }

    const agendaByRoomId = new Map<string, RoomDailyAgendaItem[]>();

    for (const reservation of typedReservations) {
      const roomAgenda = agendaByRoomId.get(reservation.room_id) ?? [];

      roomAgenda.push({
        id: reservation.id,
        roomId: reservation.room_id,
        startAt: reservation.start_at,
        endAt: reservation.end_at,
        purpose: reservation.purpose,
        category: reservation.category,
        eventId: reservation.event_id,
        isEventLinked: reservation.event_id != null,
        linkedScheduleSummary: reservation.event_id
          ? linkedScheduleSummaryByEventId.get(reservation.event_id) ?? null
          : null,
      });

      agendaByRoomId.set(reservation.room_id, roomAgenda);
    }

    return {
      data: ((rooms ?? []) as Room[]).map((room) => ({
        ...room,
        agenda: agendaByRoomId.get(room.id) ?? [],
      })) as RoomDailyAgendaRoom[],
      error: null,
    };
  } catch (error: unknown) {
    return {
      data: null,
      error: mapRoomReservationError(error, ROOM_DAILY_AGENDA_LOAD_ERROR_MESSAGE),
    };
  }
}

export async function createStandaloneRoomReservation(input: {
  roomId: string;
  title: string;
  category: RoomReservation["category"];
  startAt: string;
  endAt: string;
}) {
  try {
    const normalizedWindow = normalizeReservationWindow(input);

    if (normalizedWindow.error || !normalizedWindow.data) {
      throw new Error(normalizedWindow.error ?? "Intervalo da reserva inválido.");
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;

    if (!user?.id) {
      throw new Error("Usuário não autenticado.");
    }

    const { data, error } = await supabase
      .from("room_reservations")
      .insert([
        {
          room_id: input.roomId,
          event_id: null,
          reserved_by: user.id,
          purpose: input.title,
          category: normalizeEventCategory(input.category),
          start_at: normalizedWindow.data.startAt,
          end_at: normalizedWindow.data.endAt,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return { data: data as RoomReservation, error: null };
  } catch (error: unknown) {
    return {
      data: null,
      error: mapRoomReservationError(error, ROOM_RESERVATION_CREATE_ERROR_MESSAGE),
    };
  }
}

export async function cancelStandaloneRoomReservation(reservationId: string) {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;

    if (!user?.id) {
      throw new Error("Usuário não autenticado.");
    }

    const { data: reservationData, error: reservationError } = await supabase
      .from("room_reservations")
      .select("*")
      .eq("id", reservationId)
      .single();

    if (reservationError) throw reservationError;

    const reservation = reservationData as RoomReservation | null;

    if (!reservation) {
      throw new Error("Reserva não encontrada.");
    }

    if (reservation.reserved_by !== user.id) {
      throw new Error("Você não pode cancelar esta reserva.");
    }

    if (reservation.event_id != null) {
      throw new Error(ROOM_EVENT_LINKED_CANCELLATION_MESSAGE);
    }

    if (reservation.status !== "active") {
      throw new Error("Esta reserva já não está ativa.");
    }

    const { data, error } = await supabase
      .from("room_reservations")
      .update({ status: "cancelled" })
      .eq("id", reservationId)
      .select("*")
      .single();

    if (error) throw error;

    return { data: data as RoomReservation, error: null };
  } catch (error: unknown) {
    return {
      data: null,
      error: mapRoomReservationError(error, ROOM_RESERVATION_CANCEL_ERROR_MESSAGE),
    };
  }
}

export async function getLinkedReservationForEvent(eventId: string) {
  try {
    const { data, error } = await supabase
      .from("room_reservations")
      .select("*")
      .eq("event_id", eventId)
      .eq("status", "active")
      .order("created_at", { ascending: true });

    if (error) throw error;

    return {
      data: ((data ?? []) as RoomReservation[])[0] ?? null,
      error: null,
    };
  } catch (error: unknown) {
    return {
      data: null,
      error: mapRoomReservationError(error, ROOM_EVENT_LINK_LOAD_ERROR_MESSAGE),
    };
  }
}
