import test from "node:test";
import assert from "node:assert/strict";
import { loadServiceModule } from "./serviceTestHelpers";

type EventService = typeof import("../src/services/eventService");

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
    return fn();
  } finally {
    globalThis.Date = RealDate;
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

test("createEvent rejects private events without selected members", { concurrency: false }, async () => {
  const { calls, supabaseMock } = createEventQueryMock({
    data: { id: "event-1" },
  });
  const { createEvent } = loadServiceModule<EventService>(
    "../src/services/eventService",
    supabaseMock,
  );

  const result = await withFixedDate("2026-04-24T10:00:00.000Z", () =>
    createEvent({
      title: "Reuniao interna",
      is_public: false,
      visible_to_user_ids: [],
      start_at: "2026-04-24T22:00:00.000Z",
    }),
  );

  assert.equal(result.data, null);
  assert.equal(result.error, "Selecione pelo menos um membro para evento privado.");
  assert.deepEqual(calls.from, []);
});

test("createEvent saves selected members for private events", { concurrency: false }, async () => {
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
      visible_to_user_ids: ["user-1", "user-2"],
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
