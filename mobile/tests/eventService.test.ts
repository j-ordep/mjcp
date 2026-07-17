import test from "node:test";
import assert from "node:assert/strict";
import { loadServiceModule } from "./serviceTestHelpers";

type EventService = typeof import("../src/services/eventService");

function loadEventServiceModule(supabaseMock: unknown) {
  const roomReservationServiceModulePath = require.resolve("../src/services/roomReservationService");
  delete require.cache[roomReservationServiceModulePath];
  return loadServiceModule<EventService>(
    "../src/services/eventService",
    supabaseMock,
  );
}

function withFixedDate<T>(dateIso: string, fn: () => T) {
  const RealDate = Date;
  const fixedMillis = new RealDate(dateIso).getTime();

  class FixedDate extends RealDate {
    constructor(...args: [] | [string | number | Date]) {
      if (args.length === 0) {
        super(fixedMillis);
        return;
      }

      super(args[0]);
    }

    static now() {
      return fixedMillis;
    }
  }

  globalThis.Date = FixedDate as typeof Date;

  try {
    const result = fn();

    if (
      result &&
      typeof ((result as unknown) as PromiseLike<unknown>).then === "function"
    ) {
      return Promise.resolve(result).finally(() => {
        globalThis.Date = RealDate;
      }) as T;
    }

    return result;
  } finally {
    if (globalThis.Date !== RealDate) {
      globalThis.Date = RealDate;
    }
  }
}

type MockResponse = {
  data?: unknown;
  error?: { message: string } | null;
};

function createEventQueryMock(response: MockResponse | MockResponse[]) {
  const responses = Array.isArray(response) ? [...response] : null;
  const nextResponse = () => responses?.shift() ?? (response as MockResponse);
  const calls = {
    from: [] as string[],
    select: [] as unknown[][],
    gte: [] as unknown[][],
    order: [] as unknown[][],
    limit: [] as unknown[][],
    insert: [] as unknown[][],
    update: [] as unknown[][],
    delete: [] as unknown[][],
    eq: [] as unknown[][],
  };

  const builder: any = {
    select: (...args: unknown[]) => {
      calls.select.push(args);
      return builder;
    },
    gte: (...args: unknown[]) => {
      calls.gte.push(args);
      return builder;
    },
    order: (...args: unknown[]) => {
      calls.order.push(args);
      return builder;
    },
    limit: (...args: unknown[]) => {
      calls.limit.push(args);
      return builder;
    },
    insert: (...args: unknown[]) => {
      calls.insert.push(args);
      return builder;
    },
    update: (...args: unknown[]) => {
      calls.update.push(args);
      return builder;
    },
    delete: (...args: unknown[]) => {
      calls.delete.push(args);
      return builder;
    },
    eq: (...args: unknown[]) => {
      calls.eq.push(args);
      return builder;
    },
    single: async () => {
      const currentResponse = nextResponse();
      return {
        data: currentResponse.data ?? null,
        error: currentResponse.error ?? null,
      };
    },
    then: (
      onfulfilled: (value: { data: unknown; error: { message: string } | null }) => unknown,
      onrejected?: (reason: unknown) => unknown,
    ) =>
      {
        const currentResponse = nextResponse();
        return Promise.resolve({
          data: currentResponse.data ?? null,
          error: currentResponse.error ?? null,
        }).then(onfulfilled, onrejected);
      },
  };

  const supabaseMock = {
    from: (table: string) => {
      calls.from.push(table);
      return builder;
    },
  };

  return { calls, supabaseMock };
}

function createEventAudienceMock(config: {
  eventResponses?: MockResponse[];
  audienceSelectResponse?: MockResponse;
  audienceInsertResponse?: MockResponse;
  audienceDeleteResponse?: MockResponse;
}) {
  const eventResponses = [...(config.eventResponses ?? [])];
  const calls = {
    from: [] as string[],
    eventInserts: [] as unknown[][],
    eventUpdates: [] as unknown[][],
    eventSelects: [] as unknown[][],
    eventEqs: [] as unknown[][],
    audienceInserts: [] as unknown[][],
    audienceDeletes: 0,
    audienceSelects: [] as unknown[][],
    audienceEqs: [] as unknown[][],
  };

  const eventsBuilder: any = {
    insert: (...args: unknown[]) => {
      calls.eventInserts.push(args);
      return eventsBuilder;
    },
    update: (...args: unknown[]) => {
      calls.eventUpdates.push(args);
      return eventsBuilder;
    },
    select: (...args: unknown[]) => {
      calls.eventSelects.push(args);
      return eventsBuilder;
    },
    eq: (...args: unknown[]) => {
      calls.eventEqs.push(args);
      return eventsBuilder;
    },
    single: async () => {
      const current = eventResponses.shift() ?? {};
      return {
        data: current.data ?? null,
        error: current.error ?? null,
      };
    },
  };

  const eventAudiencesBuilder: any = {
    select: (...args: unknown[]) => {
      calls.audienceSelects.push(args);
      return eventAudiencesBuilder;
    },
    insert: (...args: unknown[]) => {
      calls.audienceInserts.push(args);
      return eventAudiencesBuilder;
    },
    delete: () => {
      calls.audienceDeletes += 1;
      return eventAudiencesBuilder;
    },
    eq: (...args: unknown[]) => {
      calls.audienceEqs.push(args);
      return eventAudiencesBuilder;
    },
    then: (
      onfulfilled: (value: { data: unknown; error: { message: string } | null }) => unknown,
      onrejected?: (reason: unknown) => unknown,
    ) =>
      Promise.resolve({
        data:
          calls.audienceDeletes > 0 && calls.audienceInserts.length === 0 && calls.audienceSelects.length === 0
            ? config.audienceDeleteResponse?.data ?? null
            : calls.audienceSelects.length > 0
              ? config.audienceSelectResponse?.data ?? null
              : config.audienceInsertResponse?.data ?? null,
        error:
          calls.audienceDeletes > 0 && calls.audienceInserts.length === 0 && calls.audienceSelects.length === 0
            ? config.audienceDeleteResponse?.error ?? null
            : calls.audienceSelects.length > 0
              ? config.audienceSelectResponse?.error ?? null
              : config.audienceInsertResponse?.error ?? null,
      }).then(onfulfilled, onrejected),
  };

  const supabaseMock = {
    from: (table: string) => {
      calls.from.push(table);

      if (table === "events") {
        return eventsBuilder;
      }

      if (table === "event_audiences") {
        return eventAudiencesBuilder;
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };

  return { calls, supabaseMock };
}

function createEventRpcMock(config: {
  rpcResponse?: MockResponse;
  currentEventResponse?: MockResponse;
  currentAudienceResponse?: MockResponse;
  currentReservationResponse?: MockResponse;
}) {
  const calls = {
    from: [] as string[],
    eventSelects: [] as unknown[][],
    eventEqs: [] as unknown[][],
    audienceSelects: [] as unknown[][],
    audienceEqs: [] as unknown[][],
    reservationSelects: [] as unknown[][],
    reservationEqs: [] as unknown[][],
    reservationOrders: [] as unknown[][],
    rpc: [] as Array<{ fn: string; args: Record<string, unknown> }>,
  };

  const eventsBuilder: any = {
    select: (...args: unknown[]) => {
      calls.eventSelects.push(args);
      return eventsBuilder;
    },
    eq: (...args: unknown[]) => {
      calls.eventEqs.push(args);
      return eventsBuilder;
    },
    single: async () => ({
      data: config.currentEventResponse?.data ?? null,
      error: config.currentEventResponse?.error ?? null,
    }),
  };

  const eventAudiencesBuilder: any = {
    select: (...args: unknown[]) => {
      calls.audienceSelects.push(args);
      return eventAudiencesBuilder;
    },
    eq: (...args: unknown[]) => {
      calls.audienceEqs.push(args);
      return eventAudiencesBuilder;
    },
    then: (
      onfulfilled: (value: { data: unknown; error: { message: string } | null }) => unknown,
      onrejected?: (reason: unknown) => unknown,
    ) =>
      Promise.resolve({
        data: config.currentAudienceResponse?.data ?? null,
        error: config.currentAudienceResponse?.error ?? null,
      }).then(onfulfilled, onrejected),
  };

  const roomReservationsBuilder: any = {
    select: (...args: unknown[]) => {
      calls.reservationSelects.push(args);
      return roomReservationsBuilder;
    },
    eq: (...args: unknown[]) => {
      calls.reservationEqs.push(args);
      return roomReservationsBuilder;
    },
    order: (...args: unknown[]) => {
      calls.reservationOrders.push(args);
      return roomReservationsBuilder;
    },
    then: (
      onfulfilled: (value: { data: unknown; error: { message: string } | null }) => unknown,
      onrejected?: (reason: unknown) => unknown,
    ) =>
      Promise.resolve({
        data: config.currentReservationResponse?.data ?? null,
        error: config.currentReservationResponse?.error ?? null,
      }).then(onfulfilled, onrejected),
  };

  const supabaseMock = {
    from: (table: string) => {
      calls.from.push(table);

      if (table === "events") {
        return eventsBuilder;
      }

      if (table === "event_audiences") {
        return eventAudiencesBuilder;
      }

      if (table === "room_reservations") {
        return roomReservationsBuilder;
      }

      throw new Error(`Unexpected table: ${table}`);
    },
    rpc: async (fn: string, args: Record<string, unknown>) => {
      calls.rpc.push({ fn, args });
      return {
        data: config.rpcResponse?.data ?? null,
        error: config.rpcResponse?.error ?? null,
      };
    },
  };

  return { calls, supabaseMock };
}

function createBatchEventRpcMock(response: MockResponse) {
  const calls = {
    from: [] as string[],
    rpc: [] as Array<{ fn: string; args: Record<string, unknown> }>,
  };

  const supabaseMock = {
    from: (table: string) => {
      calls.from.push(table);
      throw new Error(`Unexpected direct table access: ${table}`);
    },
    rpc: async (fn: string, args: Record<string, unknown>) => {
      calls.rpc.push({ fn, args });
      return {
        data: response.data ?? null,
        error: response.error ?? null,
      };
    },
  };

  return { calls, supabaseMock };
}

test("getUpcomingEvents queries public events by end date and start order", { concurrency: false }, async () => {
  const { calls, supabaseMock } = createEventQueryMock({
    data: [
      {
        id: "event-1",
        title: "Culto",
        category: "geral",
        start_at: "2026-04-24T22:00:00.000Z",
        end_at: "2026-04-25T01:00:00.000Z",
      },
    ],
  });
  const { getUpcomingEvents } = loadServiceModule<EventService>(
    "../src/services/eventService",
    supabaseMock,
  );

  const result = await withFixedDate("2026-04-24T10:00:00.000Z", () =>
    getUpcomingEvents(7),
  );

  assert.equal(result.error, null);
  assert.equal(calls.from[0], "events");
  assert.deepEqual(calls.select[0], ["*"]);
  assert.deepEqual(calls.gte[0], ["end_at", "2026-04-24T10:00:00.000Z"]);
  assert.deepEqual(calls.order[0], ["start_at", { ascending: true }]);
  assert.deepEqual(calls.limit[0], [7]);
});

test("getEvents queries all events ordered by start date", { concurrency: false }, async () => {
  const { calls, supabaseMock } = createEventQueryMock({
    data: [
      {
        id: "event-1",
        title: "Culto antigo",
        start_at: "2026-04-20T22:00:00.000Z",
        end_at: "2026-04-21T01:00:00.000Z",
      },
    ],
  });
  const { getEvents } = loadServiceModule<EventService>(
    "../src/services/eventService",
    supabaseMock,
  );

  const result = await getEvents(50);

  assert.equal(result.error, null);
  assert.equal(calls.from[0], "events");
  assert.deepEqual(calls.select[0], ["*"]);
  assert.deepEqual(calls.order[0], ["start_at", { ascending: true }]);
  assert.deepEqual(calls.limit[0], [50]);
  assert.deepEqual(calls.gte, []);
});

test("getUpcomingEvents hides technical backend errors behind a friendly fallback", { concurrency: false }, async () => {
  const { supabaseMock } = createEventQueryMock({
    error: {
      message: 'new row violates row-level security policy for table "events"',
    },
  });
  const { getUpcomingEvents } = loadServiceModule<EventService>(
    "../src/services/eventService",
    supabaseMock,
  );

  const result = await getUpcomingEvents();

  assert.equal(
    result.error,
    "Nao foi possivel carregar os eventos. Tente novamente em alguns instantes.",
  );
});

test("getEventById queries a single event by id", { concurrency: false }, async () => {
  const { calls, supabaseMock } = createEventQueryMock({
    data: {
      id: "event-1",
      title: "Culto",
      category: "culto",
      description: null,
      location: "Templo",
      start_at: "2026-04-24T22:00:00.000Z",
      end_at: "2026-04-25T01:00:00.000Z",
      is_public: true,
    },
  });
  const { getEventById } = loadServiceModule<EventService>(
    "../src/services/eventService",
    supabaseMock,
  );

  const result = await getEventById("event-1");

  assert.equal(result.error, null);
  assert.deepEqual(calls.select[0], ["*"]);
  assert.deepEqual(calls.eq[0], ["id", "event-1"]);
});

test("getEventEditorData loads private event with audience ids", { concurrency: false }, async () => {
  const { calls, supabaseMock } = createEventAudienceMock({
    eventResponses: [
      {
        data: {
          id: "event-1",
          title: "Reuniao interna",
          category: "geral",
          description: null,
          location: "Sala 1",
          start_at: "2026-04-24T22:00:00.000Z",
          end_at: "2026-04-25T01:00:00.000Z",
          is_public: false,
        },
      },
    ],
    audienceSelectResponse: {
      data: [{ user_id: "user-1" }, { user_id: "user-2" }],
    },
  });
  const { getEventEditorData } = loadServiceModule<EventService>(
    "../src/services/eventService",
    supabaseMock,
  );

  const result = await getEventEditorData("event-1");

  assert.equal(result.error, null);
  assert.deepEqual(calls.eventSelects[0], ["*"]);
  assert.deepEqual(calls.eventEqs[0], ["id", "event-1"]);
  assert.deepEqual(calls.audienceSelects[0], ["user_id"]);
  assert.deepEqual(calls.audienceEqs[0], ["event_id", "event-1"]);
  assert.deepEqual(result.data?.visible_to_user_ids, ["user-1", "user-2"]);
});

test("getEventEditorData skips audience lookup for public event", { concurrency: false }, async () => {
  const { calls, supabaseMock } = createEventAudienceMock({
    eventResponses: [
      {
        data: {
          id: "event-2",
          title: "Culto",
          category: "culto",
          description: null,
          location: "Templo",
          start_at: "2026-04-24T22:00:00.000Z",
          end_at: "2026-04-25T01:00:00.000Z",
          is_public: true,
        },
      },
    ],
  });
  const { getEventEditorData } = loadServiceModule<EventService>(
    "../src/services/eventService",
    supabaseMock,
  );

  const result = await getEventEditorData("event-2");

  assert.equal(result.error, null);
  assert.deepEqual(result.data?.visible_to_user_ids, []);
  assert.deepEqual(calls.audienceSelects, []);
});

test("createEvent normalizes dates and uses the default end time", { concurrency: false }, async () => {
  const { calls, supabaseMock } = createEventQueryMock({
    data: { id: "event-1", title: "Culto" },
  });
  const { createEvent } = loadServiceModule<EventService>(
    "../src/services/eventService",
    supabaseMock,
  );

  const result = await withFixedDate("2026-04-24T10:00:00.000Z", () =>
    createEvent({
      title: "Culto",
      start_at: "2026-04-24T22:00:00.000Z",
    }),
  );

  assert.equal(result.error, null);
  assert.deepEqual(calls.insert[0], [
    [
      {
        title: "Culto",
        category: "geral",
        is_public: true,
        start_at: "2026-04-24T22:00:00.000Z",
        end_at: "2026-04-25T01:00:00.000Z",
      },
    ],
  ]);
});

test("createMultipleEvents sends normalized events and audiences to the transactional rpc", { concurrency: false }, async () => {
  const { calls, supabaseMock } = createBatchEventRpcMock({
    data: [
      {
        id: "event-1",
        title: "Reuniao interna",
        category: "geral",
        start_at: "2099-05-02T19:00:00.000Z",
        end_at: "2099-05-02T22:00:00.000Z",
        is_public: false,
      },
      {
        id: "event-2",
        title: "Culto",
        category: "culto",
        start_at: "2099-05-03T19:00:00.000Z",
        end_at: "2099-05-03T22:00:00.000Z",
        is_public: true,
      },
    ],
  });
  const { createMultipleEvents } = loadServiceModule<EventService>(
    "../src/services/eventService",
    supabaseMock,
  );

  const result = await withFixedDate("2026-04-24T10:00:00.000Z", () =>
    createMultipleEvents([
      {
        title: "Reuniao interna",
        category: "geral",
        description: "Equipe",
        location: "Sala 1",
        is_public: false,
        visible_to_user_ids: [" user-1 ", "user-1", "", "user-2"],
        start_at: "2099-05-02T19:00:00.000Z",
      },
      {
        title: "Culto",
        category: "culto",
        is_public: true,
        visible_to_user_ids: ["user-3"],
        start_at: "2099-05-03T19:00:00.000Z",
      },
    ]),
  );

  assert.equal(result.error, null);
  assert.deepEqual(calls.from, []);
  assert.deepEqual(calls.rpc[0], {
    fn: "create_events_with_audiences",
    args: {
      p_events: [
        {
          title: "Reuniao interna",
          category: "geral",
          description: "Equipe",
          location: "Sala 1",
          start_at: "2099-05-02T19:00:00.000Z",
          end_at: "2099-05-02T22:00:00.000Z",
          is_public: false,
          visible_to_user_ids: ["user-1", "user-2"],
        },
        {
          title: "Culto",
          category: "culto",
          start_at: "2099-05-03T19:00:00.000Z",
          end_at: "2099-05-03T22:00:00.000Z",
          is_public: true,
          visible_to_user_ids: [],
        },
      ],
    },
  });
});

test("updateEvent normalizes date ranges before saving", { concurrency: false }, async () => {
  const { calls, supabaseMock } = createEventQueryMock({
    data: { id: "event-1", title: "Culto atualizado" },
  });
  const { updateEvent } = loadServiceModule<EventService>(
    "../src/services/eventService",
    supabaseMock,
  );

  const result = await withFixedDate("2026-04-24T10:00:00.000Z", () =>
    updateEvent("event-1", {
      title: "Culto atualizado",
      start_at: "2026-04-24T22:00:00.000Z",
      end_at: "2026-04-25T00:00:00.000Z",
    }),
  );

  assert.equal(result.error, null);
  assert.deepEqual(calls.update[0], [
    {
      title: "Culto atualizado",
      start_at: "2026-04-24T22:00:00.000Z",
      end_at: "2026-04-25T00:00:00.000Z",
    },
  ]);
  assert.deepEqual(calls.eq[0], ["id", "event-1"]);
});

test("updateEvent keeps the current start date when only endAt changes", { concurrency: false }, async () => {
  const { calls, supabaseMock } = createEventQueryMock([
    {
      data: { start_at: "2099-04-24T22:00:00.000Z" },
    },
    {
      data: { id: "event-1", title: "Culto" },
    },
  ]);
  const { updateEvent } = loadServiceModule<EventService>(
    "../src/services/eventService",
    supabaseMock,
  );

  const result = await withFixedDate("2026-04-24T10:00:00.000Z", () =>
    updateEvent("event-1", {
      end_at: "2099-04-25T00:00:00.000Z",
    }),
  );

  assert.equal(result.error, null);
  assert.deepEqual(calls.select[0], ["start_at,is_public"]);
  assert.deepEqual(calls.eq[0], ["id", "event-1"]);
  assert.deepEqual(calls.update[0], [
    {
      end_at: "2099-04-25T00:00:00.000Z",
    },
  ]);
  assert.deepEqual(calls.eq[1], ["id", "event-1"]);
});

test("createEvent allows a private event without selected members", { concurrency: false }, async () => {
  const { calls, supabaseMock } = createEventAudienceMock({
    eventResponses: [{ data: { id: "event-1", title: "Reuniao interna" } }],
  });
  const { createEvent } = loadServiceModule<EventService>(
    "../src/services/eventService",
    supabaseMock,
  );

  const result = await withFixedDate("2026-04-24T10:00:00.000Z", () =>
    createEvent({
      title: "Reuniao interna",
      is_public: false,
      visible_to_user_ids: [" ", ""],
      start_at: "2026-04-24T22:00:00.000Z",
    }),
  );

  assert.equal(result.error, null);
  assert.deepEqual(calls.eventInserts[0], [
    [
      {
        title: "Reuniao interna",
        category: "geral",
        is_public: false,
        start_at: "2026-04-24T22:00:00.000Z",
        end_at: "2026-04-25T01:00:00.000Z",
      },
    ],
  ]);
  assert.equal(calls.audienceInserts.length, 0);
});

test("createEvent normalizes and saves selected members for private events", { concurrency: false }, async () => {
  const { calls, supabaseMock } = createEventAudienceMock({
    eventResponses: [{ data: { id: "event-1", title: "Reuniao interna" } }],
    audienceInsertResponse: { data: [{ event_id: "event-1", user_id: "user-1" }] },
  });
  const { createEvent } = loadServiceModule<EventService>(
    "../src/services/eventService",
    supabaseMock,
  );

  const result = await withFixedDate("2026-04-24T10:00:00.000Z", () =>
    createEvent({
      title: "Reuniao interna",
      is_public: false,
      visible_to_user_ids: [" user-1 ", "user-1", "", "user-2 ", "   "],
      start_at: "2026-04-24T22:00:00.000Z",
    }),
  );

  assert.equal(result.error, null);
  assert.deepEqual(calls.eventInserts[0], [
    [
      {
        title: "Reuniao interna",
        category: "geral",
        is_public: false,
        start_at: "2026-04-24T22:00:00.000Z",
        end_at: "2026-04-25T01:00:00.000Z",
      },
    ],
  ]);
  assert.deepEqual(calls.audienceInserts[0], [
    [
      { event_id: "event-1", user_id: "user-1" },
      { event_id: "event-1", user_id: "user-2" },
    ],
  ]);
});

test("updateEvent rewrites the audience list for private events", { concurrency: false }, async () => {
  const { calls, supabaseMock } = createEventAudienceMock({
    eventResponses: [{ data: { id: "event-1", title: "Reuniao interna" } }],
    audienceInsertResponse: { data: [{ event_id: "event-1", user_id: "user-3" }] },
  });
  const { updateEvent } = loadServiceModule<EventService>(
    "../src/services/eventService",
    supabaseMock,
  );

  const result = await withFixedDate("2026-04-24T10:00:00.000Z", () =>
    updateEvent("event-1", {
      is_public: false,
      visible_to_user_ids: ["user-3"],
    }),
  );

  assert.equal(result.error, null);
  assert.equal(calls.audienceDeletes, 1);
  assert.deepEqual(calls.audienceEqs[0], ["event_id", "event-1"]);
  assert.deepEqual(calls.audienceInserts[0], [[{ event_id: "event-1", user_id: "user-3" }]]);
});

test("updateEvent allows a private event to keep an empty audience", { concurrency: false }, async () => {
  const { calls, supabaseMock } = createEventAudienceMock({
    eventResponses: [{ data: { id: "event-1", title: "Reuniao interna" } }],
  });
  const { updateEvent } = loadServiceModule<EventService>(
    "../src/services/eventService",
    supabaseMock,
  );

  const result = await withFixedDate("2026-04-24T10:00:00.000Z", () =>
    updateEvent("event-1", {
      is_public: false,
      visible_to_user_ids: [" ", ""],
    }),
  );

  assert.equal(result.error, null);
  assert.deepEqual(calls.eventUpdates[0], [{ is_public: false }]);
  assert.equal(calls.audienceDeletes, 1);
  assert.deepEqual(calls.audienceEqs[0], ["event_id", "event-1"]);
  assert.equal(calls.audienceInserts.length, 0);
});

test("saveEventWithOptionalRoom normalizes audience ids before calling the rpc", { concurrency: false }, async () => {
  const { calls, supabaseMock } = createEventRpcMock({
    rpcResponse: {
      data: {
        id: "event-1",
        title: "Reuniao interna",
      },
    },
  });
  const { saveEventWithOptionalRoom } = loadEventServiceModule(supabaseMock);

  const result = await withFixedDate("2026-04-24T10:00:00.000Z", () =>
    saveEventWithOptionalRoom({
      event: {
        title: "Reuniao interna",
        category: "reunião",
        is_public: false,
        visible_to_user_ids: [" user-1 ", "user-1", "", "user-2"],
        start_at: "2099-05-02T19:00:00.000Z",
      },
      roomId: "room-1",
    }),
  );

  assert.equal(result.error, null);
  assert.deepEqual(calls.rpc[0], {
    fn: "save_event_with_optional_room_reservation",
    args: {
      p_event_id: null,
      p_title: "Reuniao interna",
      p_category: "reunião",
      p_description: null,
      p_location: null,
      p_start_at: "2099-05-02T19:00:00.000Z",
      p_end_at: "2099-05-02T22:00:00.000Z",
      p_is_public: false,
      p_visible_user_ids: ["user-1", "user-2"],
      p_room_id: "room-1",
    },
  });
});

test("saveEventWithOptionalRoom maps room overlap conflicts to a stable message", { concurrency: false }, async () => {
  const { supabaseMock } = createEventRpcMock({
    currentEventResponse: {
      data: {
        id: "event-1",
        title: "Reuniao interna",
        category: "reunião",
        description: null,
        location: null,
        start_at: "2099-05-02T19:00:00.000Z",
        end_at: "2099-05-02T21:00:00.000Z",
        is_public: false,
      },
    },
    currentAudienceResponse: {
      data: [],
    },
    currentReservationResponse: {
      data: [{
        id: "reservation-1",
        room_id: "room-1",
        event_id: "event-1",
        reserved_by: "user-admin",
        start_at: "2099-05-02T19:00:00.000Z",
        end_at: "2099-05-02T21:00:00.000Z",
        purpose: "Reuniao interna",
        category: "reunião",
        status: "active",
        created_at: "2026-05-01T10:00:00.000Z",
      }],
    },
    rpcResponse: {
      error: { message: "conflicting key value violates exclusion constraint \"no_overlap\"" },
    },
  });
  const { saveEventWithOptionalRoom } = loadEventServiceModule(supabaseMock);

  const result = await withFixedDate("2026-04-24T10:00:00.000Z", () =>
    saveEventWithOptionalRoom({
      eventId: "event-1",
      event: {
        title: "Reuniao interna",
        is_public: false,
        visible_to_user_ids: [],
        start_at: "2099-05-02T19:00:00.000Z",
      },
      roomId: "room-1",
    }),
  );

  assert.equal(result.error, "Esta sala já está reservada para esse horário.");
});

test("saveEventWithOptionalRoom preserves omitted private audience and linked room during edit", { concurrency: false }, async () => {
  const { calls, supabaseMock } = createEventRpcMock({
    currentEventResponse: {
      data: {
        id: "event-1",
        title: "Reuniao interna",
        category: "reunião",
        description: "Atual",
        location: "Sala antiga",
        start_at: "2026-05-02T19:00:00.000Z",
        end_at: "2026-05-02T21:00:00.000Z",
        is_public: false,
      },
    },
    currentAudienceResponse: {
      data: [{ user_id: "user-1" }, { user_id: "user-2" }],
    },
    currentReservationResponse: {
      data: [{
        id: "reservation-1",
        room_id: "room-7",
        event_id: "event-1",
        reserved_by: "user-admin",
        start_at: "2026-05-02T19:00:00.000Z",
        end_at: "2026-05-02T21:00:00.000Z",
        purpose: "Reuniao interna",
        category: "reunião",
        status: "active",
        created_at: "2026-05-01T10:00:00.000Z",
      }],
    },
    rpcResponse: {
      data: {
        id: "event-1",
        title: "Reuniao interna ajustada",
      },
    },
  });
  const { saveEventWithOptionalRoom } = loadEventServiceModule(supabaseMock);

  const result = await withFixedDate("2026-04-24T10:00:00.000Z", () =>
    saveEventWithOptionalRoom({
      eventId: "event-1",
      event: {
        title: "Reuniao interna ajustada",
      },
    }),
  );

  assert.equal(result.error, null);
  assert.deepEqual(calls.rpc[0], {
    fn: "save_event_with_optional_room_reservation",
    args: {
      p_event_id: "event-1",
      p_title: "Reuniao interna ajustada",
      p_category: "reunião",
      p_description: "Atual",
      p_location: "Sala antiga",
      p_start_at: "2026-05-02T19:00:00.000Z",
      p_end_at: "2026-05-02T21:00:00.000Z",
      p_is_public: false,
      p_visible_user_ids: ["user-1", "user-2"],
      p_room_id: "room-7",
    },
  });
});

test("saveEventWithOptionalRoom distinguishes explicit audience and room clearing from omission", { concurrency: false }, async () => {
  const { calls, supabaseMock } = createEventRpcMock({
    currentEventResponse: {
      data: {
        id: "event-1",
        title: "Reuniao interna",
        category: "reunião",
        description: "Atual",
        location: "Sala antiga",
        start_at: "2026-05-02T19:00:00.000Z",
        end_at: "2026-05-02T21:00:00.000Z",
        is_public: false,
      },
    },
    currentAudienceResponse: {
      data: [{ user_id: "user-1" }, { user_id: "user-2" }],
    },
    currentReservationResponse: {
      data: [{
        id: "reservation-1",
        room_id: "room-7",
        event_id: "event-1",
        reserved_by: "user-admin",
        start_at: "2026-05-02T19:00:00.000Z",
        end_at: "2026-05-02T21:00:00.000Z",
        purpose: "Reuniao interna",
        category: "reunião",
        status: "active",
        created_at: "2026-05-01T10:00:00.000Z",
      }],
    },
    rpcResponse: {
      data: {
        id: "event-1",
      },
    },
  });
  const { saveEventWithOptionalRoom } = loadEventServiceModule(supabaseMock);

  const result = await withFixedDate("2026-04-24T10:00:00.000Z", () =>
    saveEventWithOptionalRoom({
      eventId: "event-1",
      event: {
        visible_to_user_ids: [],
      },
      roomId: null,
    }),
  );

  assert.equal(result.error, null);
  assert.deepEqual(calls.rpc[0], {
    fn: "save_event_with_optional_room_reservation",
    args: {
      p_event_id: "event-1",
      p_title: "Reuniao interna",
      p_category: "reunião",
      p_description: "Atual",
      p_location: "Sala antiga",
      p_start_at: "2026-05-02T19:00:00.000Z",
      p_end_at: "2026-05-02T21:00:00.000Z",
      p_is_public: false,
      p_visible_user_ids: [],
      p_room_id: null,
    },
  });
});
