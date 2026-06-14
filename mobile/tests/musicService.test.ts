import test from "node:test";
import assert from "node:assert/strict";
import { loadServiceModule } from "./serviceTestHelpers";

type MusicService = typeof import("../src/services/musicService");

function createSongsMock(config: {
  songs?: unknown[];
  songById?: unknown | null;
  songByIdError?: { message: string } | null;
  eventSetlists?: unknown[];
  eventSetlistDeleteError?: { message: string } | null;
  eventSetlistInsertError?: { message: string } | null;
  replaceEventSetlistRpcError?: { message: string } | null;
}) {
  const calls = {
    songsOrders: [] as unknown[][],
    songsEqs: [] as unknown[][],
    eventSetlistSelects: [] as unknown[][],
    eventSetlistOrders: [] as unknown[][],
    eventSetlistEqs: [] as unknown[][],
    eventSetlistDeletes: 0,
    eventSetlistInserts: [] as unknown[][],
    rpcCalls: [] as unknown[][],
  };

  let eventSetlistOperation: "select" | "delete" | "insert" | null = null;
  let songsOperation: "list" | "single" = "list";

  const songsBuilder: any = {
    select: () => songsBuilder,
    order: (...args: unknown[]) => {
      songsOperation = "list";
      calls.songsOrders.push(args);
      return songsBuilder;
    },
    eq: (...args: unknown[]) => {
      songsOperation = "single";
      calls.songsEqs.push(args);
      return songsBuilder;
    },
    single: () => songsBuilder,
    then: (
      onfulfilled: (
        value:
          | { data: unknown[]; error: null }
          | { data: unknown; error: { message: string } | null },
      ) => unknown,
      onrejected?: (reason: unknown) => unknown,
    ) => {
      if (songsOperation === "single") {
        return Promise.resolve({
          data: config.songById ?? null,
          error: config.songByIdError ?? null,
        }).then(onfulfilled, onrejected);
      }

      return Promise.resolve({
        data: config.songs ?? [],
        error: null,
      }).then(onfulfilled, onrejected);
    },
  };

  const eventSetlistsBuilder: any = {
    select: (...args: unknown[]) => {
      eventSetlistOperation = "select";
      calls.eventSetlistSelects.push(args);
      return eventSetlistsBuilder;
    },
    order: (...args: unknown[]) => {
      calls.eventSetlistOrders.push(args);
      return eventSetlistsBuilder;
    },
    eq: (...args: unknown[]) => {
      calls.eventSetlistEqs.push(args);
      return eventSetlistsBuilder;
    },
    delete: () => {
      eventSetlistOperation = "delete";
      calls.eventSetlistDeletes += 1;
      return eventSetlistsBuilder;
    },
    insert: (...args: unknown[]) => {
      eventSetlistOperation = "insert";
      calls.eventSetlistInserts.push(args);
      return eventSetlistsBuilder;
    },
    then: (
      onfulfilled: (value: { data: unknown; error: { message: string } | null }) => unknown,
      onrejected?: (reason: unknown) => unknown,
    ) => {
      if (eventSetlistOperation === "delete") {
        return Promise.resolve({
          data: null,
          error: config.eventSetlistDeleteError ?? null,
        }).then(onfulfilled, onrejected);
      }

      if (eventSetlistOperation === "insert") {
        return Promise.resolve({
          data: null,
          error: config.eventSetlistInsertError ?? null,
        }).then(onfulfilled, onrejected);
      }

      return Promise.resolve({
        data: config.eventSetlists ?? [],
        error: null,
      }).then(onfulfilled, onrejected);
    },
  };

  return {
    calls,
    supabaseMock: {
      from: (table: string) => {
        if (table === "songs") return songsBuilder;
        if (table === "event_setlists") return eventSetlistsBuilder;
        throw new Error(`Unexpected table: ${table}`);
      },
      rpc: (...args: unknown[]) => {
        calls.rpcCalls.push(args);

        return Promise.resolve({
          data: null,
          error: config.replaceEventSetlistRpcError ?? null,
        });
      },
    },
  };
}

function createUpcomingEventsMock(events: unknown[] | null, error: string | null = null) {
  const eventServiceModulePath = require.resolve("../src/services/eventService");

  delete require.cache[eventServiceModulePath];
  require.cache[eventServiceModulePath] = ({
    id: eventServiceModulePath,
    filename: eventServiceModulePath,
    loaded: true,
    exports: {
      getUpcomingEvents: async () => ({
        data: events,
        error,
      }),
    },
    children: [],
    paths: [],
  } as unknown) as NodeJS.Module;
}

test("getSongsCatalog loads songs ordered by title", async () => {
  const { calls, supabaseMock } = createSongsMock({
    songs: [
      {
        id: "song-1",
        title: "A Ele a Gloria",
        artist: "Coral",
        key: "G",
        bpm: 72,
        category: "louvor",
        lyrics_url: null,
        created_at: "2026-05-01T00:00:00.000Z",
      },
    ],
  });

  const { getSongsCatalog } = loadServiceModule<MusicService>(
    "../src/services/musicService",
    supabaseMock,
  );

  const result = await getSongsCatalog();

  assert.equal(result.error, null);
  assert.equal(result.data?.[0]?.title, "A Ele a Gloria");
  assert.deepEqual(calls.songsOrders[0], ["title", { ascending: true }]);
});

test("getSongById loads a single song by id", async () => {
  const { calls, supabaseMock } = createSongsMock({
    songById: {
      id: "song-42",
      title: "Meu Refugio",
      artist: "Equipe",
      key: "E",
      bpm: 76,
      category: "louvor",
      lyrics_url: "https://example.com/refugio",
      created_at: "2026-05-01T00:00:00.000Z",
    },
  });

  const { getSongById } = loadServiceModule<MusicService>(
    "../src/services/musicService",
    supabaseMock,
  );

  const result = await getSongById("song-42");

  assert.equal(result.error, null);
  assert.equal(result.data?.title, "Meu Refugio");
  assert.deepEqual(calls.songsEqs[0], ["id", "song-42"]);
});

test("getNextUpcomingEventSetlist returns the next event with ordered songs", async () => {
  createUpcomingEventsMock([
    {
      id: "event-1",
      title: "Culto de Domingo",
      category: "culto",
      description: null,
      location: "Templo",
      start_at: "2026-05-18T22:00:00.000Z",
      end_at: "2026-05-19T00:00:00.000Z",
      is_public: true,
    },
  ]);

  const { calls, supabaseMock } = createSongsMock({
    eventSetlists: [
      {
        id: "setlist-1",
        event_id: "event-1",
        song_id: "song-2",
        position: 1,
        song_key: "D",
        songs: {
          id: "song-2",
          title: "Santo",
          artist: "Equipe",
          key: "D",
          bpm: 70,
          category: "adoracao",
          lyrics_url: null,
          created_at: "2026-05-01T00:00:00.000Z",
        },
      },
    ],
  });

  const { getNextUpcomingEventSetlist } = loadServiceModule<MusicService>(
    "../src/services/musicService",
    supabaseMock,
  );

  const result = await getNextUpcomingEventSetlist();

  assert.equal(result.error, null);
  assert.equal(result.data?.event?.title, "Culto de Domingo");
  assert.equal(result.data?.songs[0]?.song.title, "Santo");
  assert.deepEqual(calls.eventSetlistEqs[0], ["event_id", "event-1"]);
  assert.deepEqual(calls.eventSetlistOrders[0], ["position", { ascending: true }]);
});

test("replaceEventSetlist uses transactional rpc and preserves selection order", async () => {
  createUpcomingEventsMock([]);

  const { calls, supabaseMock } = createSongsMock({
    eventSetlists: [
      {
        id: "setlist-1",
        event_id: "event-1",
        song_id: "song-1",
        position: 1,
        song_key: null,
        songs: {
          id: "song-1",
          title: "Primeira",
          artist: null,
          key: "C",
          bpm: null,
          category: "louvor",
          lyrics_url: null,
          created_at: "2026-05-01T00:00:00.000Z",
        },
      },
      {
        id: "setlist-2",
        event_id: "event-1",
        song_id: "song-2",
        position: 2,
        song_key: "D",
        songs: {
          id: "song-2",
          title: "Segunda",
          artist: null,
          key: "D",
          bpm: null,
          category: "adoracao",
          lyrics_url: null,
          created_at: "2026-05-01T00:00:00.000Z",
        },
      },
    ],
  });

  const { replaceEventSetlist } = loadServiceModule<MusicService>(
    "../src/services/musicService",
    supabaseMock,
  );

  const result = await replaceEventSetlist({
    eventId: "event-1",
    items: [
      { song_id: "song-1" },
      { song_id: "song-2", song_key: "D" },
    ],
  });

  assert.equal(result.error, null);
  assert.deepEqual(calls.rpcCalls[0], [
    "replace_event_setlist",
    {
      p_event_id: "event-1",
      p_items: [
        {
          song_id: "song-1",
          song_key: null,
        },
        {
          song_id: "song-2",
          song_key: "D",
        },
      ],
    },
  ]);
  assert.equal(calls.eventSetlistDeletes, 0);
  assert.equal(calls.eventSetlistInserts.length, 0);
  assert.equal(result.data?.length, 2);
});

test("replaceEventSetlist returns rpc errors without fetching stale setlist data", async () => {
  createUpcomingEventsMock([]);

  const { calls, supabaseMock } = createSongsMock({
    replaceEventSetlistRpcError: {
      message: "duplicate key value violates unique constraint",
    },
  });

  const { replaceEventSetlist } = loadServiceModule<MusicService>(
    "../src/services/musicService",
    supabaseMock,
  );

  const result = await replaceEventSetlist({
    eventId: "event-1",
    items: [{ song_id: "song-1" }, { song_id: "song-1" }],
  });

  assert.equal(result.data, null);
  assert.equal(result.error, "duplicate key value violates unique constraint");
  assert.equal(calls.rpcCalls.length, 1);
  assert.equal(calls.eventSetlistSelects.length, 0);
  assert.equal(calls.eventSetlistDeletes, 0);
  assert.equal(calls.eventSetlistInserts.length, 0);
});
