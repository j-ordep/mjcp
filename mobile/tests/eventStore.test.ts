import test from "node:test";
import assert from "node:assert/strict";
import type { Event } from "../src/types/models";

type EventStoreModule = typeof import("../src/stores/useEventStore");
type EventState = ReturnType<EventStoreModule["useEventStore"]["getState"]>;

const event: Event = {
  id: "event-example",
  title: "Evento de exemplo",
  category: "geral",
  description: null,
  location: null,
  start_at: "2030-01-01T18:00:00.000Z",
  end_at: "2030-01-01T21:00:00.000Z",
  is_public: true,
};

function loadEventStore(options: {
  mutationResult?: { data: Event | Event[] | null; error: string | null };
  upcomingResult?: { data: Event[] | null; error: string | null };
  allResult?: { data: Event[] | null; error: string | null };
  upcomingFetch?: () => Promise<{ data: Event[] | null; error: string | null }>;
  mutationFetch?: () => Promise<{ data: Event | null; error: string | null }>;
  allFetch?: () => Promise<{ data: Event[] | null; error: string | null }>;
} = {}) {
  const calls: { method: string; args: unknown[] }[] = [];
  const record = (method: string, result: unknown) => async (...args: unknown[]) => {
    calls.push({ method, args });
    return result;
  };
  const mutationResult = options.mutationResult ?? { data: event, error: null };
  const servicePath = require.resolve("../src/services/eventService");
  const storePath = require.resolve("../src/stores/useEventStore");
  const originalService = require.cache[servicePath];
  const originalStore = require.cache[storePath];

  delete require.cache[storePath];
  require.cache[servicePath] = {
    id: servicePath,
    filename: servicePath,
    loaded: true,
    exports: {
      createMultipleEvents: record("createMultipleEvents", mutationResult),
      saveEventWithOptionalRoom: options.mutationFetch ?? record("saveEventWithOptionalRoom", mutationResult),
      getUpcomingEvents: options.upcomingFetch ?? record("getUpcomingEvents", options.upcomingResult ?? {
        data: [event], error: null,
      }),
      getEvents: options.allFetch ?? record("getEvents", options.allResult ?? {
        data: [event, { ...event, id: "past-example" }], error: null,
      }),
    },
    children: [],
    paths: [],
  } as unknown as NodeJS.Module;

  const { useEventStore } = require(storePath) as EventStoreModule;
  if (originalService) require.cache[servicePath] = originalService;
  else delete require.cache[servicePath];
  if (originalStore) require.cache[storePath] = originalStore;
  else delete require.cache[storePath];
  return { useEventStore, calls };
}

const mutations = [
  {
    name: "createBatchEvents",
    run: (state: EventState) => state.createBatchEvents([event]),
    method: "createMultipleEvents",
    args: [[event]],
  },
  {
    name: "createEventWithRoom",
    run: (state: EventState) => state.createEventWithRoom(event, "room-example"),
    method: "saveEventWithOptionalRoom",
    args: [{ event, roomId: "room-example" }],
  },
  {
    name: "updateEventWithRoom",
    run: (state: EventState) => state.updateEventWithRoom(event.id, event),
    method: "saveEventWithOptionalRoom",
    args: [{ eventId: event.id, event, roomId: undefined }],
  },
];

test("event reset invalidates pending reads", async () => {
  let resolve!: (value: { data: Event[]; error: null }) => void;
  const { useEventStore } = loadEventStore({ upcomingFetch: () => new Promise(r => { resolve = r; }) });
  const pending = useEventStore.getState().fetchUpcomingEvents(true);
  (useEventStore.getState() as EventState & { clearEvents: () => void }).clearEvents();
  resolve({ data: [event], error: null });
  await pending;
  assert.deepEqual(useEventStore.getState().events, []);
  assert.equal(useEventStore.getState().isLoadingEvents, false);
});

test("event reads accept only the newest response", async () => {
  const resolvers: ((value: { data: Event[]; error: null }) => void)[] = [];
  const { useEventStore } = loadEventStore({ upcomingFetch: () => new Promise(r => resolvers.push(r)) });
  const first = useEventStore.getState().fetchUpcomingEvents(true);
  const second = useEventStore.getState().fetchUpcomingEvents(true);
  resolvers[1]({ data: [{ ...event, id: "newest" }], error: null });
  await second;
  resolvers[0]({ data: [event], error: null });
  await first;
  assert.equal(useEventStore.getState().events[0].id, "newest");
});

test("a mutation completed after reset cannot refresh the next session", async () => {
  let resolve!: (value: { data: Event; error: null }) => void;
  const { useEventStore, calls } = loadEventStore({ mutationFetch: () => new Promise(r => { resolve = r; }) });
  const pending = useEventStore.getState().createEventWithRoom(event, null);
  (useEventStore.getState() as EventState & { clearEvents: () => void }).clearEvents();
  resolve({ data: event, error: null });
  assert.deepEqual(await pending, { data: event, error: null });
  assert.deepEqual(calls, []);
});

test("a mutation refresh already in flight cannot restore cleared session lists", async () => {
  let resolve!: (value: { data: Event[]; error: null }) => void;
  const { useEventStore } = loadEventStore({ upcomingFetch: () => new Promise(r => { resolve = r; }) });
  const pending = useEventStore.getState().createEventWithRoom(event, null);
  await Promise.resolve();
  useEventStore.getState().clearEvents();
  resolve({ data: [event], error: null });
  await pending;
  assert.deepEqual(useEventStore.getState().events, []);
  assert.deepEqual(useEventStore.getState().allEvents, []);
});

test("all-event reads cannot restore stale errors or lists after reset", async () => {
  let resolve!: (value: { data: null; error: string }) => void;
  const { useEventStore } = loadEventStore({ allFetch: () => new Promise(r => { resolve = r; }) });
  useEventStore.setState({ events: [event], allEvents: [event], error: "prior" });
  const pending = useEventStore.getState().fetchEvents(true);
  useEventStore.getState().clearEvents();
  resolve({ data: null, error: "old session failure" });
  await pending;
  assert.deepEqual(useEventStore.getState().allEvents, []);
  assert.equal(useEventStore.getState().error, null);
  assert.equal(useEventStore.getState().isLoadingAllEvents, false);
});

test("an upcoming read started after mutation refresh preserves its response while all-events refreshes", async () => {
  let resolveMutation!: (value: { data: Event; error: null }) => void;
  const upcomingResponses: ((value: { data: Event[]; error: null }) => void)[] = [];
  const { useEventStore, calls } = loadEventStore({
    mutationFetch: () => new Promise(r => { resolveMutation = r; }),
    upcomingFetch: () => new Promise(r => upcomingResponses.push(r)),
  });
  useEventStore.setState({ allEvents: [{ ...event, id: "old-all" }] });
  const mutation = useEventStore.getState().createEventWithRoom(event, null);
  resolveMutation({ data: event, error: null });
  await Promise.resolve();
  const upcoming = useEventStore.getState().fetchUpcomingEvents(true);
  upcomingResponses[1]({ data: [{ ...event, id: "new-upcoming" }], error: null });
  await upcoming;
  upcomingResponses[0]({ data: [event], error: null });
  await mutation;
  assert.deepEqual(useEventStore.getState().allEvents.map(item => item.id), [event.id, "past-example"]);
  assert.equal(useEventStore.getState().events[0].id, "new-upcoming");
  assert.deepEqual(calls, [{ method: "getEvents", args: [] }]);
});

for (const completionOrder of [[0, 1], [1, 0]]) {
  test(`overlapping successful writes refresh the last committed event in completion order ${completionOrder.join(",")}`, async () => {
    const commits: ((value: { data: Event; error: null }) => void)[] = [];
    let persisted = event;
    const { useEventStore } = loadEventStore({
      mutationFetch: () => new Promise(r => commits.push(r)),
      allFetch: async () => ({ data: [persisted], error: null }),
    });
    const writes = [
      useEventStore.getState().createEventWithRoom(event, null),
      useEventStore.getState().createEventWithRoom(event, null),
    ];
    for (const index of completionOrder) {
      persisted = { ...event, id: `committed-${index}` };
      commits[index]({ data: persisted, error: null });
      await writes[index];
    }
    assert.equal(useEventStore.getState().allEvents[0].id, `committed-${completionOrder[1]}`);
  });
}

test("an older mutation refresh cannot overwrite lists refreshed by a later commit", async () => {
  const upcoming: ((value: { data: Event[]; error: null }) => void)[] = [];
  const all: ((value: { data: Event[]; error: null }) => void)[] = [];
  const { useEventStore } = loadEventStore({
    upcomingFetch: () => new Promise(r => upcoming.push(r)),
    allFetch: () => new Promise(r => all.push(r)),
  });
  const first = useEventStore.getState().createEventWithRoom(event, null);
  const second = useEventStore.getState().createEventWithRoom(event, null);
  await Promise.resolve();
  const latest = { data: [{ ...event, id: "latest-commit" }], error: null };
  upcoming[1](latest);
  all[1](latest);
  await second;
  upcoming[0]({ data: [event], error: null });
  all[0]({ data: [event], error: null });
  await first;
  assert.equal(useEventStore.getState().events[0].id, "latest-commit");
  assert.equal(useEventStore.getState().allEvents[0].id, "latest-commit");
});

for (const mutation of mutations) {
  test(`${mutation.name} keeps loading and refreshes both lists after saving`, async () => {
    const saved = mutation.name === "createBatchEvents" ? [event] : event;
    const { useEventStore, calls } = loadEventStore({
      mutationResult: { data: saved, error: null },
    });
    useEventStore.setState({ error: "Erro anterior", isLoadingAllEvents: true });

    const pending = mutation.run(useEventStore.getState());
    assert.equal(useEventStore.getState().isLoadingEvents, true);
    assert.equal(useEventStore.getState().error, null);
    assert.deepEqual(await pending, { data: saved, error: null });
    assert.deepEqual(calls, [
      { method: mutation.method, args: mutation.args },
      { method: "getUpcomingEvents", args: [] },
      { method: "getEvents", args: [] },
    ]);
    assert.deepEqual(useEventStore.getState().events, [event]);
    assert.equal(useEventStore.getState().allEvents.length, 2);
    assert.equal(useEventStore.getState().isLoadingEvents, false);
    assert.equal(useEventStore.getState().isLoadingAllEvents, false);
  });

  test(`${mutation.name} keeps cached lists and skips refresh when saving fails`, async () => {
    const { useEventStore, calls } = loadEventStore({
      mutationResult: { data: null, error: "Falha de exemplo" },
    });
    useEventStore.setState({
      events: [event], allEvents: [event], isLoadingAllEvents: true,
    });

    assert.deepEqual(await mutation.run(useEventStore.getState()), {
      data: null, error: "Falha de exemplo",
    });
    assert.deepEqual(calls, [{ method: mutation.method, args: mutation.args }]);
    assert.deepEqual(useEventStore.getState().events, [event]);
    assert.deepEqual(useEventStore.getState().allEvents, [event]);
    assert.equal(useEventStore.getState().error, "Falha de exemplo");
    assert.equal(useEventStore.getState().isLoadingEvents, false);
    assert.equal(useEventStore.getState().isLoadingAllEvents, true);
  });
}

test("a successful mutation still succeeds when refresh returns no data", async () => {
  const { useEventStore } = loadEventStore({
    upcomingResult: { data: null, error: "Falha de leitura" },
    allResult: { data: null, error: "Falha de leitura" },
  });
  useEventStore.setState({ events: [event], allEvents: [event] });

  assert.deepEqual(await useEventStore.getState().createEventWithRoom(event, null), {
    data: event, error: null,
  });
  assert.deepEqual(useEventStore.getState().events, []);
  assert.deepEqual(useEventStore.getState().allEvents, []);
  assert.equal(useEventStore.getState().error, null);
});

for (const [action, list, loading, method] of [
  ["fetchUpcomingEvents", "events", "isLoadingEvents", "getUpcomingEvents"],
  ["fetchEvents", "allEvents", "isLoadingAllEvents", "getEvents"],
] as const) {
  test(`${action} uses cached data unless refresh is forced`, async () => {
    const { useEventStore, calls } = loadEventStore();
    useEventStore.setState({ [list]: [event] });
    await useEventStore.getState()[action]();
    assert.deepEqual(calls, []);
    await useEventStore.getState()[action](true);
    assert.deepEqual(calls, [{ method, args: [] }]);
    assert.equal(useEventStore.getState()[loading], false);
  });

  test(`${action} keeps cached data when a forced refresh fails`, async () => {
    const failure = { data: null, error: "Falha de leitura" };
    const { useEventStore } = loadEventStore({ upcomingResult: failure, allResult: failure });
    useEventStore.setState({ [list]: [event] });
    await useEventStore.getState()[action](true);
    assert.deepEqual(useEventStore.getState()[list], [event]);
    assert.equal(useEventStore.getState().error, failure.error);
    assert.equal(useEventStore.getState()[loading], false);
  });
}
