import test from "node:test";
import assert from "node:assert/strict";
import { mountScreen, deferred } from "./screenTestHelpers";

const song = { id: "song-example", title: "Canção exemplo", key: "C" };
const event = { id: "event-example", title: "Evento exemplo", start_at: "2099-01-01T12:00:00Z" };
const item = { id: "setlist-example", song_id: song.id, song_key: "D", song, position: 1 };

function mount(options: { event?: any; save?: () => Promise<any>; eventError?: string; loadEvent?: () => Promise<any> } = {}) {
  let setlistReads = 0;
  const auth = { profile: { role: "admin", can_manage_events: true }, sessionRevision: 1, session: { user: { id: "user-example" } } };
  const useAuthStore = Object.assign(() => auth, { getState: () => auth });
  const screen = mountScreen("src/screens/app/EventSetlistScreen.tsx", {
    useAuthStore: { useAuthStore },
    eventService: { getEventById: options.loadEvent ?? (async () => ({ data: options.eventError ? null : options.event ?? event, error: options.eventError ?? null })) },
    musicService: {
      getSongsCatalog: async () => ({ data: [song], error: null }),
      getEventSetlist: async () => { setlistReads++; return { data: [item], error: null }; },
      replaceEventSetlist: options.save ?? (async () => ({ saved: true, data: [], error: null })),
    },
  }, { eventId: event.id });
  return { screen, auth, reads: () => setlistReads };
}

test("setlist verifies event visibility before querying its songs", async () => {
  const { screen, reads } = mount({ eventError: "Não autorizado" });
  await screen.flush();
  assert.equal(reads(), 0);
  assert.equal(screen.findAll("SetlistEditor").length, 0);
  screen.cleanup();
});

test("historical setlists stay readable without exposing the editor", async () => {
  const { screen, reads } = mount({ event: { ...event, start_at: "2000-01-01T12:00:00Z" } });
  await screen.flush();
  assert.equal(reads(), 1);
  assert.equal(screen.findAll("SetlistEditor").length, 0);
  assert.equal(screen.findAll("DefaultButton").some((node) => node.props.children === "Editar repertório"), false);
  screen.cleanup();
});

test("setlist keeps a dirty draft across refocus and write failure", async () => {
  const { screen } = mount({ save: async () => ({ saved: false, data: null, error: "Falha de escrita" }) });
  await screen.flush();
  screen.findAll("DefaultButton").find((node) => node.props.children === "Editar repertório").props.onPress();
  await screen.flush();
  screen.findAll("SetlistEditor")[0].props.onRemoveSong(song.id);
  await screen.flush();
  assert.equal(screen.preventRemove.enabled, true);
  screen.focus(false); await screen.flush(); screen.focus(true); await screen.flush();
  assert.equal(screen.findAll("SetlistEditor")[0].props.songs.length, 0);
  await screen.findAll("SetlistEditor")[0].props.onSave(); await screen.flush();
  assert.equal(screen.findAll("SetlistEditor")[0].props.songs.length, 0);
  assert.equal(screen.preventRemove.enabled, true);
  screen.cleanup();
});

test("a confirmed write with failed readback retains the draft and avoids another blind save", async () => {
  const result = deferred<any>();
  const { screen } = mount({ save: () => result.promise });
  await screen.flush();
  screen.findAll("DefaultButton").find((node) => node.props.children === "Editar repertório").props.onPress();
  await screen.flush();
  const save = screen.findAll("SetlistEditor")[0].props.onSave();
  result.resolve({ saved: true, data: null, error: "Releitura indisponível" });
  await save; await screen.flush();
  assert.equal(screen.findAll("SetlistEditor")[0].props.songs[0].song_key, "D");
  assert.equal(screen.findAll("SetlistEditor")[0].props.disabled, true);
  screen.cleanup();
});

test("saving during refresh clears loading state and ignores the invalidated refresh", async () => {
  const refresh = deferred<any>();
  let eventReads = 0;
  const { screen } = mount({
    loadEvent: () => ++eventReads === 1
      ? Promise.resolve({ data: event, error: null })
      : refresh.promise,
  });
  await screen.flush();
  screen.findAll("DefaultButton").find((node) => node.props.children === "Editar repertório").props.onPress();
  await screen.flush();
  screen.findAll("ScrollView")[0].props.refreshControl.props.onRefresh();
  await screen.flush();
  assert.equal(screen.findAll("ScrollView")[0].props.refreshControl.props.refreshing, true);
  await screen.findAll("SetlistEditor")[0].props.onSave();
  await screen.flush();
  assert.equal(screen.findAll("ScrollView")[0].props.refreshControl.props.refreshing, false);
  refresh.resolve({ data: null, error: "Resposta antiga" });
  await screen.flush();
  assert.equal(screen.findAll("ScrollView")[0].props.refreshControl.props.refreshing, false);
  assert.equal(screen.findAll("SetlistEditor").length, 0);
  assert.equal(screen.findAll("DefaultButton").some((node) => node.props.children === "Editar repertório"), true);
  screen.cleanup();
});
