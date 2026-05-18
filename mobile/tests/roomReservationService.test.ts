import test from "node:test";
import assert from "node:assert/strict";
import { loadServiceModule } from "./serviceTestHelpers";

type RoomReservationService = typeof import("../src/services/roomReservationService");

type MockResponse = {
  data?: unknown;
  error?: { message: string } | null;
};

function createRoomsWindowMock(config: {
  rooms: unknown[];
  reservations: unknown[];
  schedules?: unknown[];
  scheduleError?: { message: string } | null;
}) {
  const calls = {
    roomOrders: [] as unknown[][],
    reservationSelects: [] as unknown[][],
    reservationEqs: [] as unknown[][],
    reservationLts: [] as unknown[][],
    reservationGts: [] as unknown[][],
    reservationOrders: [] as unknown[][],
    scheduleSelects: [] as unknown[][],
    scheduleIns: [] as unknown[][],
  };

  const roomBuilder: any = {
    select: () => roomBuilder,
    order: (...args: unknown[]) => {
      calls.roomOrders.push(args);
      return roomBuilder;
    },
    then: (onfulfilled: (value: { data: unknown; error: null }) => unknown) =>
      Promise.resolve({ data: config.rooms, error: null }).then(onfulfilled),
  };

  const reservationBuilder: any = {
    select: (...args: unknown[]) => {
      calls.reservationSelects.push(args);
      return reservationBuilder;
    },
    eq: (...args: unknown[]) => {
      calls.reservationEqs.push(args);
      return reservationBuilder;
    },
    lt: (...args: unknown[]) => {
      calls.reservationLts.push(args);
      return reservationBuilder;
    },
    gt: (...args: unknown[]) => {
      calls.reservationGts.push(args);
      return reservationBuilder;
    },
    order: (...args: unknown[]) => {
      calls.reservationOrders.push(args);
      return reservationBuilder;
    },
    then: (onfulfilled: (value: { data: unknown; error: null }) => unknown) =>
      Promise.resolve({ data: config.reservations, error: null }).then(onfulfilled),
  };

  const scheduleBuilder: any = {
    select: (...args: unknown[]) => {
      calls.scheduleSelects.push(args);
      return scheduleBuilder;
    },
    in: (...args: unknown[]) => {
      calls.scheduleIns.push(args);
      return scheduleBuilder;
    },
    then: (
      onfulfilled: (value: { data: unknown; error: { message: string } | null }) => unknown,
      onrejected?: (reason: unknown) => unknown,
    ) =>
      Promise.resolve({
        data: config.schedules ?? [],
        error: config.scheduleError ?? null,
      }).then(onfulfilled, onrejected),
  };

  return {
    calls,
    supabaseMock: {
      from: (table: string) => {
        if (table === "rooms") return roomBuilder;
        if (table === "room_reservations") return reservationBuilder;
        if (table === "schedules") return scheduleBuilder;
        throw new Error(`Unexpected table: ${table}`);
      },
    },
  };
}

function createRoomInsertMock(config: {
  authUserId?: string | null;
  response: MockResponse;
}) {
  const calls = {
    inserts: [] as unknown[][],
    selects: [] as unknown[][],
  };

  const builder: any = {
    insert: (...args: unknown[]) => {
      calls.inserts.push(args);
      return builder;
    },
    select: (...args: unknown[]) => {
      calls.selects.push(args);
      return builder;
    },
    single: async () => ({
      data: config.response.data ?? null,
      error: config.response.error ?? null,
    }),
  };

  return {
    calls,
    supabaseMock: {
      auth: {
        getUser: async () => ({
          data: {
            user: config.authUserId ? { id: config.authUserId } : null,
          },
          error: null,
        }),
      },
      from: (table: string) => {
        if (table !== "room_reservations") {
          throw new Error(`Unexpected table: ${table}`);
        }
        return builder;
      },
    },
  };
}

function createLinkedReservationMock(response: MockResponse) {
  const calls = {
    selects: [] as unknown[][],
    eqs: [] as unknown[][],
    orders: [] as unknown[][],
  };

  const builder: any = {
    select: (...args: unknown[]) => {
      calls.selects.push(args);
      return builder;
    },
    eq: (...args: unknown[]) => {
      calls.eqs.push(args);
      return builder;
    },
    order: (...args: unknown[]) => {
      calls.orders.push(args);
      return builder;
    },
    then: (
      onfulfilled: (value: { data: unknown; error: { message: string } | null }) => unknown,
      onrejected?: (reason: unknown) => unknown,
    ) =>
      Promise.resolve({
        data: response.data ?? null,
        error: response.error ?? null,
      }).then(onfulfilled, onrejected),
  };

  return {
    calls,
    supabaseMock: {
      from: (table: string) => {
        if (table !== "room_reservations") {
          throw new Error(`Unexpected table: ${table}`);
        }
        return builder;
      },
    },
  };
}

function createCancelReservationMock(config: {
  authUserId?: string | null;
  reservationResponse: MockResponse;
  updateResponse: MockResponse;
}) {
  const calls = {
    selects: [] as unknown[][],
    eqs: [] as unknown[][],
    updates: [] as unknown[][],
  };
  let phase: "select" | "update" = "select";

  const builder: any = {
    select: (...args: unknown[]) => {
      calls.selects.push(args);
      return builder;
    },
    eq: (...args: unknown[]) => {
      calls.eqs.push(args);
      return builder;
    },
    update: (...args: unknown[]) => {
      calls.updates.push(args);
      phase = "update";
      return builder;
    },
    single: async () =>
      phase === "select"
        ? {
            data: config.reservationResponse.data ?? null,
            error: config.reservationResponse.error ?? null,
          }
        : {
            data: config.updateResponse.data ?? null,
            error: config.updateResponse.error ?? null,
          },
  };

  return {
    calls,
    supabaseMock: {
      auth: {
        getUser: async () => ({
          data: {
            user: config.authUserId ? { id: config.authUserId } : null,
          },
          error: null,
        }),
      },
      from: (table: string) => {
        if (table !== "room_reservations") {
          throw new Error(`Unexpected table: ${table}`);
        }
        return builder;
      },
    },
  };
}

test("getRoomsForWindow returns room availability with overlapping reservation summary", async () => {
  const { calls, supabaseMock } = createRoomsWindowMock({
    rooms: [{ id: "room-1", name: "Sala 1", capacity: 20, description: null }],
    reservations: [{
      id: "reservation-1",
      room_id: "room-1",
      event_id: null,
      reserved_by: "user-1",
      start_at: "2026-05-02T19:00:00.000Z",
      end_at: "2026-05-02T21:00:00.000Z",
      purpose: "Reunião do louvor",
      category: "reunião",
      status: "active",
      created_at: "2026-05-01T10:00:00.000Z",
    }],
  });
  const { getRoomsForWindow } = loadServiceModule<RoomReservationService>(
    "../src/services/roomReservationService",
    supabaseMock,
  );

  const result = await getRoomsForWindow({
    startAt: "2026-05-02T19:30:00.000Z",
    endAt: "2026-05-02T20:30:00.000Z",
  });

  assert.equal(result.error, null);
  assert.deepEqual(calls.roomOrders[0], ["name", { ascending: true }]);
  assert.deepEqual(calls.reservationSelects[0], ["*"]);
  assert.deepEqual(calls.reservationEqs[0], ["status", "active"]);
  assert.deepEqual(calls.reservationLts[0], ["start_at", "2026-05-02T20:30:00.000Z"]);
  assert.deepEqual(calls.reservationGts[0], ["end_at", "2026-05-02T19:30:00.000Z"]);
  assert.equal(result.data?.[0].status, "occupied");
  assert.equal(result.data?.[0].reservation?.purpose, "Reunião do louvor");
});

test("getRoomsDailyAgenda groups daily reservations per room and attaches linked schedule summaries", async () => {
  const { calls, supabaseMock } = createRoomsWindowMock({
    rooms: [
      { id: "room-1", name: "Sala 1", capacity: 20, description: null },
      { id: "room-2", name: "Sala 2", capacity: 12, description: null },
    ],
    reservations: [
      {
        id: "reservation-1",
        room_id: "room-1",
        event_id: "event-1",
        reserved_by: "user-1",
        start_at: "2026-05-05T19:00:00.000Z",
        end_at: "2026-05-05T21:00:00.000Z",
        purpose: "Culto da noite",
        category: "culto",
        status: "active",
        created_at: "2026-05-01T10:00:00.000Z",
      },
      {
        id: "reservation-2",
        room_id: "room-2",
        event_id: null,
        reserved_by: "user-2",
        start_at: "2026-05-05T14:00:00.000Z",
        end_at: "2026-05-05T15:30:00.000Z",
        purpose: "Reunião de alinhamento",
        category: "reunião",
        status: "active",
        created_at: "2026-05-01T11:00:00.000Z",
      },
    ],
    schedules: [
      {
        id: "schedule-1",
        event_id: "event-1",
        schedule_assignments: [
          { id: "assignment-1", status: "confirmed" },
          { id: "assignment-2", status: "pending" },
        ],
      },
      {
        id: "schedule-2",
        event_id: "event-1",
        schedule_assignments: [{ id: "assignment-3", status: "confirmed" }],
      },
    ],
  });
  const { getRoomsDailyAgenda } = loadServiceModule<RoomReservationService>(
    "../src/services/roomReservationService",
    supabaseMock,
  );
  const expectedDayStart = new Date("2026-05-05T00:00:00").toISOString();
  const expectedDayEnd = new Date("2026-05-06T00:00:00").toISOString();

  const result = await getRoomsDailyAgenda("2026-05-05");

  assert.equal(result.error, null);
  assert.deepEqual(calls.roomOrders[0], ["name", { ascending: true }]);
  assert.deepEqual(calls.reservationSelects[0], ["*"]);
  assert.deepEqual(calls.reservationEqs[0], ["status", "active"]);
  assert.deepEqual(calls.reservationLts[0], ["start_at", expectedDayEnd]);
  assert.deepEqual(calls.reservationGts[0], ["end_at", expectedDayStart]);
  assert.equal(calls.scheduleSelects.length, 1);
  assert.deepEqual(calls.scheduleIns[0], ["event_id", ["event-1"]]);
  assert.equal(result.data?.[0].agenda.length, 1);
  assert.equal(result.data?.[0].agenda[0].isEventLinked, true);
  assert.deepEqual(result.data?.[0].agenda[0].linkedScheduleSummary, {
    schedulesCount: 2,
    assignmentsCount: 3,
    confirmedAssignmentsCount: 2,
    pendingAssignmentsCount: 1,
  });
  assert.equal(result.data?.[1].agenda[0].linkedScheduleSummary, null);
});

test("getRoomsDailyAgenda skips schedule loading when the day has no event-linked reservations", async () => {
  const { calls, supabaseMock } = createRoomsWindowMock({
    rooms: [{ id: "room-1", name: "Sala 1", capacity: 20, description: null }],
    reservations: [
      {
        id: "reservation-1",
        room_id: "room-1",
        event_id: null,
        reserved_by: "user-1",
        start_at: "2026-05-05T09:00:00.000Z",
        end_at: "2026-05-05T10:00:00.000Z",
        purpose: "Manutenção",
        category: "geral",
        status: "active",
        created_at: "2026-05-01T10:00:00.000Z",
      },
    ],
  });
  const { getRoomsDailyAgenda } = loadServiceModule<RoomReservationService>(
    "../src/services/roomReservationService",
    supabaseMock,
  );

  const result = await getRoomsDailyAgenda("2026-05-05");

  assert.equal(result.error, null);
  assert.equal(calls.scheduleSelects.length, 0);
  assert.equal(result.data?.[0].agenda[0].isEventLinked, false);
});

test("getRoomsDailyAgenda keeps agenda when linked schedules cannot be loaded", async () => {
  const { calls, supabaseMock } = createRoomsWindowMock({
    rooms: [{ id: "room-1", name: "Sala 1", capacity: 20, description: null }],
    reservations: [
      {
        id: "reservation-1",
        room_id: "room-1",
        event_id: "event-1",
        reserved_by: "user-1",
        start_at: "2026-05-05T19:00:00.000Z",
        end_at: "2026-05-05T21:00:00.000Z",
        purpose: "Culto da noite",
        category: "culto",
        status: "active",
        created_at: "2026-05-01T10:00:00.000Z",
      },
    ],
    scheduleError: { message: "permission denied for relation schedules" },
  });
  const { getRoomsDailyAgenda } = loadServiceModule<RoomReservationService>(
    "../src/services/roomReservationService",
    supabaseMock,
  );

  const result = await getRoomsDailyAgenda("2026-05-05");

  assert.equal(calls.scheduleSelects.length, 1);
  assert.equal(result.error, null);
  assert.equal(result.data?.[0].agenda.length, 1);
  assert.equal(result.data?.[0].agenda[0].isEventLinked, true);
  assert.equal(result.data?.[0].agenda[0].linkedScheduleSummary, null);
});

test("createStandaloneRoomReservation includes the current user and maps overlap conflicts", async () => {
  const { calls, supabaseMock } = createRoomInsertMock({
    authUserId: "user-1",
    response: {
      error: { message: "conflicting key value violates exclusion constraint \"no_overlap\"" },
    },
  });
  const { createStandaloneRoomReservation } = loadServiceModule<RoomReservationService>(
    "../src/services/roomReservationService",
    supabaseMock,
  );

  const result = await createStandaloneRoomReservation({
    roomId: "room-1",
    title: "Reunião do louvor",
    category: "reunião",
    startAt: "2026-05-02T19:00:00.000Z",
    endAt: "2026-05-02T21:00:00.000Z",
  });

  assert.deepEqual(calls.inserts[0], [[{
    room_id: "room-1",
    event_id: null,
    reserved_by: "user-1",
    purpose: "Reunião do louvor",
    category: "reunião",
    start_at: "2026-05-02T19:00:00.000Z",
    end_at: "2026-05-02T21:00:00.000Z",
  }]]);
  assert.equal(result.error, "Esta sala já está reservada para esse horário.");
});

test("cancelStandaloneRoomReservation cancels the current user's active standalone reservation", async () => {
  const { calls, supabaseMock } = createCancelReservationMock({
    authUserId: "user-1",
    reservationResponse: {
      data: {
        id: "reservation-1",
        room_id: "room-1",
        event_id: null,
        reserved_by: "user-1",
        start_at: "2026-05-02T19:00:00.000Z",
        end_at: "2026-05-02T21:00:00.000Z",
        purpose: "ReuniÃ£o de alinhamento",
        category: "reuniÃ£o",
        status: "active",
        created_at: "2026-05-01T10:00:00.000Z",
      },
    },
    updateResponse: {
      data: {
        id: "reservation-1",
        room_id: "room-1",
        event_id: null,
        reserved_by: "user-1",
        start_at: "2026-05-02T19:00:00.000Z",
        end_at: "2026-05-02T21:00:00.000Z",
        purpose: "ReuniÃ£o de alinhamento",
        category: "reuniÃ£o",
        status: "cancelled",
        created_at: "2026-05-01T10:00:00.000Z",
      },
    },
  });
  const { cancelStandaloneRoomReservation } = loadServiceModule<RoomReservationService>(
    "../src/services/roomReservationService",
    supabaseMock,
  );

  const result = await cancelStandaloneRoomReservation("reservation-1");

  assert.equal(result.error, null);
  assert.deepEqual(calls.selects[0], ["*"]);
  assert.deepEqual(calls.eqs.slice(0, 1), [["id", "reservation-1"]]);
  assert.deepEqual(calls.updates[0], [{ status: "cancelled" }]);
  assert.deepEqual(calls.eqs.slice(1), [["id", "reservation-1"]]);
  assert.equal(result.data?.status, "cancelled");
});

test("cancelStandaloneRoomReservation blocks reservations linked to an event", async () => {
  const { calls, supabaseMock } = createCancelReservationMock({
    authUserId: "user-1",
    reservationResponse: {
      data: {
        id: "reservation-1",
        room_id: "room-1",
        event_id: "event-1",
        reserved_by: "user-1",
        start_at: "2026-05-02T19:00:00.000Z",
        end_at: "2026-05-02T21:00:00.000Z",
        purpose: "Culto da noite",
        category: "culto",
        status: "active",
        created_at: "2026-05-01T10:00:00.000Z",
      },
    },
    updateResponse: {},
  });
  const { cancelStandaloneRoomReservation } = loadServiceModule<RoomReservationService>(
    "../src/services/roomReservationService",
    supabaseMock,
  );

  const result = await cancelStandaloneRoomReservation("reservation-1");

  assert.equal(
    result.error,
    "Esta reserva estÃ¡ vinculada a um evento e nÃ£o pode ser cancelada por aqui.",
  );
  assert.equal(calls.updates.length, 0);
});

test("getLinkedReservationForEvent returns the first active reservation for the event", async () => {
  const { calls, supabaseMock } = createLinkedReservationMock({
    data: [
      {
        id: "reservation-1",
        room_id: "room-1",
        event_id: "event-1",
        reserved_by: "user-1",
        start_at: "2026-05-02T19:00:00.000Z",
        end_at: "2026-05-02T21:00:00.000Z",
        purpose: "Reunião interna",
        category: "reunião",
        status: "active",
        created_at: "2026-05-01T10:00:00.000Z",
      },
      {
        id: "reservation-2",
        room_id: "room-2",
        event_id: "event-1",
        reserved_by: "user-1",
        start_at: "2026-05-02T22:00:00.000Z",
        end_at: "2026-05-03T00:00:00.000Z",
        purpose: "Reserva extra",
        category: "especial",
        status: "active",
        created_at: "2026-05-01T11:00:00.000Z",
      },
    ],
  });
  const { getLinkedReservationForEvent } = loadServiceModule<RoomReservationService>(
    "../src/services/roomReservationService",
    supabaseMock,
  );

  const result = await getLinkedReservationForEvent("event-1");

  assert.equal(result.error, null);
  assert.deepEqual(calls.selects[0], ["*"]);
  assert.deepEqual(calls.eqs[0], ["event_id", "event-1"]);
  assert.deepEqual(calls.eqs[1], ["status", "active"]);
  assert.deepEqual(calls.orders[0], ["created_at", { ascending: true }]);
  assert.equal(result.data?.id, "reservation-1");
});
