import test from "node:test";
import assert from "node:assert/strict";
import { deferred, mountScreen, textContent } from "./screenTestHelpers";

const profile = { id: "person-example", full_name: "Pessoa exemplo", email: null };
const room = { id: "room-example", name: "Sala exemplo", status: "available", reservation: null };
const window = { startAt: "2099-01-01T12:00:00Z", endAt: "2099-01-01T13:00:00Z" };

function context(services: Record<string, unknown> = {}) {
  const auth = { profile: { role: "admin" }, sessionRevision: 1 };
  return {
    auth,
    mocks: {
      useAuthStore: { useAuthStore: Object.assign(() => auth, { getState: () => auth }) },
      profileService: { listProfilesPage: async () => ({ data: [], error: null, hasMore: false }), ...services },
      roomReservationService: { getRoomsForWindow: async () => ({ data: [room], error: null }), ...services },
      "react-native-paper": { Text: "Text", TextInput: "TextInput", Switch: "Switch", Divider: "Divider" },
    },
  };
}

function audienceProps() {
  return {
    isPublic: false, selectedAudience: [] as any[],
    onVisibilityChange() {}, onAudienceChange(_profiles: any[]) {},
    onSectionLayout() {}, onSearchFocus() {},
  };
}

function roomProps() {
  return {
    singleSelectedDateKey: "2099-01-01" as string | null,
    window: window as typeof window | null, isHydrating: false,
    currentReservedRoomId: null as string | null, eventId: "event-example",
    selection: { selectedRoomId: null as string | null, hasManualRoomSelectionChange: false, isRoomSelectionAutoCleared: false },
    onSelectionChange(_selection: any) {},
  };
}

function content(screen: ReturnType<typeof mountScreen>) {
  return screen.findAll("Text").map(textContent).join(" ");
}

test("audience search debounces and discards the previous query before its replacement starts", async (t) => {
  const old = deferred<any>();
  const queries: string[] = [];
  const { mocks } = context({ listProfilesPage: (input: any) => {
    queries.push(input.query);
    return input.query === "" ? old.promise : Promise.resolve({ data: [profile], error: null, hasMore: false });
  } });
  const screen = mountScreen("src/components/events/EventAudienceSection.tsx", mocks, {}, audienceProps());
  t.after(screen.cleanup);
  await screen.flush();
  screen.findAll("TextInput")[0].props.onChangeText("Pessoa");
  await screen.flush();
  old.resolve({ data: [{ ...profile, full_name: "Resposta antiga" }], error: null, hasMore: true });
  await screen.flush();
  assert.equal(content(screen).includes("Resposta antiga"), false);
  assert.equal(queries.length, 1);
  await new Promise((resolve) => setTimeout(resolve, 270));
  await screen.flush();
  assert.equal(queries[1], "Pessoa");
  assert.match(content(screen), /Pessoa exemplo/);
});

test("audience owns pagination, excludes selected people and reports selection changes", async (t) => {
  const pages: number[] = [];
  const { mocks } = context({ listProfilesPage: async (input: any) => {
    pages.push(input.page);
    return { data: input.page === 0 ? [profile] : [profile, { ...profile, id: "other-example", full_name: "Outra pessoa" }], error: null, hasMore: input.page === 0 };
  } });
  const props = audienceProps();
  let screen: ReturnType<typeof mountScreen>;
  props.onAudienceChange = (people) => { props.selectedAudience = people; screen.rerender(); };
  screen = mountScreen("src/components/events/EventAudienceSection.tsx", mocks, {}, props);
  t.after(screen.cleanup);
  await screen.flush();
  screen.findAll("TouchableOpacity").find((node) => textContent(node).includes("Carregar mais"))!.props.onPress();
  await screen.flush();
  assert.deepEqual(pages, [0, 1]);
  screen.findAll("TouchableOpacity").find((node) => textContent(node).includes("Pessoa exemplo"))!.props.onPress();
  await screen.flush();
  assert.equal(props.selectedAudience[0].id, profile.id);
  assert.equal(screen.findAll("Text").filter((node) => textContent(node) === "Pessoa exemplo").length, 1);
  assert.match(content(screen), /Outra pessoa/);
});

test("a failed audience page keeps previously loaded people available", async (t) => {
  const { mocks } = context({ listProfilesPage: async (input: any) => input.page === 0
    ? { data: [profile], error: null, hasMore: true }
    : { data: null, error: "Falha exemplo", hasMore: false } });
  const screen = mountScreen("src/components/events/EventAudienceSection.tsx", mocks, {}, audienceProps());
  t.after(screen.cleanup);
  await screen.flush();
  screen.findAll("TouchableOpacity").find((node) => textContent(node).includes("Carregar mais"))!.props.onPress();
  await screen.flush();
  assert.match(content(screen), /Não foi possível carregar os membros agora/);
  assert.match(content(screen), /Pessoa exemplo/);
  assert.ok(screen.findAll("TouchableOpacity").some((node) => textContent(node).includes("Adicionar")));
  assert.doesNotMatch(content(screen), /Nenhum membro disponível/);
});

test("audience failures keep selected people and use the existing error message", async (t) => {
  const { mocks } = context({ listProfilesPage: async () => ({ data: null, error: "Falha exemplo", hasMore: false }) });
  const props = audienceProps();
  props.selectedAudience = [profile];
  const screen = mountScreen("src/components/events/EventAudienceSection.tsx", mocks, {}, props);
  t.after(screen.cleanup);
  await screen.flush();
  assert.equal(screen.alerts.at(-1)![1], "Não foi possível carregar os membros agora.");
  assert.match(content(screen), /Pessoa exemplo/);
  assert.match(content(screen), /Não foi possível carregar os membros agora/);
});

test("audience keeps consecutive additions and removals before the parent rerenders", async (t) => {
  const other = { ...profile, id: "other-example", full_name: "Outra pessoa" };
  const { mocks } = context({
    listProfilesPage: async () => ({ data: [profile, other], error: null, hasMore: false }),
  });
  const props = audienceProps();
  props.onAudienceChange = (people) => { props.selectedAudience = people; };
  const screen = mountScreen("src/components/events/EventAudienceSection.tsx", mocks, {}, props);
  t.after(screen.cleanup);
  await screen.flush();
  const additions = screen.findAll("TouchableOpacity");
  additions[0].props.onPress();
  additions[1].props.onPress();
  assert.deepEqual(Array.from(props.selectedAudience, (person) => person.id), [profile.id, other.id]);
  screen.rerender();
  await screen.flush();
  const removals = screen.findAll("TouchableOpacity");
  removals[0].props.onPress();
  removals[1].props.onPress();
  assert.equal(props.selectedAudience.length, 0);
});

test("audience discards delayed results after focus or session changes", async (t) => {
  const old = deferred<any>();
  const { auth, mocks } = context({ listProfilesPage: () => old.promise });
  const screen = mountScreen("src/components/events/EventAudienceSection.tsx", mocks, {}, audienceProps());
  t.after(screen.cleanup);
  await screen.flush();
  screen.focus(false);
  await screen.flush();
  auth.sessionRevision++;
  old.resolve({ data: [profile], error: null, hasMore: false });
  await screen.flush();
  assert.equal(content(screen).includes("Pessoa exemplo"), false);
  assert.equal(screen.alerts.length, 0);
});

test("public visibility discards a pending audience response without changing the selected people", async (t) => {
  const pending = deferred<any>();
  const { mocks } = context({ listProfilesPage: () => pending.promise });
  const props = audienceProps();
  props.selectedAudience = [profile];
  const screen = mountScreen("src/components/events/EventAudienceSection.tsx", mocks, {}, props);
  t.after(screen.cleanup);
  await screen.flush();
  props.isPublic = true;
  screen.rerender();
  await screen.flush();
  pending.resolve({ data: null, error: "Resposta antiga", hasMore: false });
  await screen.flush();
  assert.equal(props.selectedAudience[0].id, profile.id);
  assert.equal(screen.alerts.length, 0);
  assert.equal(screen.findAll("TextInput").length, 0);
});

test("clearing the audience search keeps the 250 ms debounce", async (t) => {
  const queries: string[] = [];
  const { mocks } = context({ listProfilesPage: async (input: any) => {
    queries.push(input.query);
    return { data: [], error: null, hasMore: false };
  } });
  const screen = mountScreen("src/components/events/EventAudienceSection.tsx", mocks, {}, audienceProps());
  t.after(screen.cleanup);
  await screen.flush();
  screen.findAll("TextInput")[0].props.onChangeText("Pessoa");
  await screen.flush();
  await new Promise((resolve) => setTimeout(resolve, 270));
  await screen.flush();
  assert.deepEqual(queries, ["", "Pessoa"]);
  screen.findAll("TextInput")[0].props.onChangeText("");
  await screen.flush();
  assert.equal(queries.length, 2);
  await new Promise((resolve) => setTimeout(resolve, 270));
  await screen.flush();
  assert.deepEqual(queries, ["", "Pessoa", ""]);
});

test("room section ignores the previous window and marks an unavailable linked room for removal", async (t) => {
  const old = deferred<any>();
  const { mocks } = context({ getRoomsForWindow: (input: any) => input.startAt === window.startAt ? old.promise : Promise.resolve({ data: [], error: null }) });
  const props = roomProps();
  props.currentReservedRoomId = room.id;
  props.selection.selectedRoomId = room.id;
  props.onSelectionChange = (selection) => { props.selection = selection; screen.rerender(); };
  const screen = mountScreen("src/components/events/EventRoomSection.tsx", mocks, {}, props);
  t.after(screen.cleanup);
  await screen.flush();
  props.window = { startAt: "2099-01-02T12:00:00Z", endAt: "2099-01-02T13:00:00Z" };
  screen.rerender();
  await screen.flush();
  assert.equal(props.selection.selectedRoomId, null);
  assert.equal(props.selection.isRoomSelectionAutoCleared, true);
  old.resolve({ data: [room], error: null });
  await screen.flush();
  assert.equal(props.selection.selectedRoomId, null);
  assert.equal(content(screen).includes("Sala exemplo"), false);
});

test("room selection made during a reload is respected when the request finishes", async (t) => {
  const pending = deferred<any>();
  let reads = 0;
  const { mocks } = context({ getRoomsForWindow: () => ++reads === 1 ? Promise.resolve({ data: [room], error: null }) : pending.promise });
  const props = roomProps();
  props.currentReservedRoomId = room.id;
  props.selection.selectedRoomId = room.id;
  props.onSelectionChange = (selection) => { props.selection = selection; screen.rerender(); };
  const screen = mountScreen("src/components/events/EventRoomSection.tsx", mocks, {}, props);
  t.after(screen.cleanup);
  await screen.flush();
  screen.focus(false);
  await screen.flush();
  screen.focus(true);
  await screen.flush();
  screen.findAll("TouchableOpacity").find((node) => textContent(node).startsWith("Sem sala"))!.props.onPress();
  await screen.flush();
  pending.resolve({ data: [room], error: null });
  await screen.flush();
  assert.equal(props.selection.selectedRoomId, null);
  assert.equal(props.selection.hasManualRoomSelectionChange, true);
  assert.equal(props.selection.isRoomSelectionAutoCleared, false);
});

test("room section clears selection for multiple dates without querying availability", async (t) => {
  let reads = 0;
  const { mocks } = context({ getRoomsForWindow: async () => { reads++; return { data: [room], error: null }; } });
  const props = roomProps();
  props.singleSelectedDateKey = null;
  props.window = null;
  props.selection.selectedRoomId = room.id;
  props.selection.hasManualRoomSelectionChange = true;
  let changed: any;
  props.onSelectionChange = (selection) => { changed = selection; };
  const screen = mountScreen("src/components/events/EventRoomSection.tsx", mocks, {}, props);
  t.after(screen.cleanup);
  await screen.flush();
  assert.equal(reads, 0);
  assert.equal(changed.selectedRoomId, null);
  assert.equal(changed.hasManualRoomSelectionChange, false);
  assert.equal(changed.isRoomSelectionAutoCleared, false);
});

test("room errors preserve selection and obsolete session responses cannot change it", async (t) => {
  const pending = deferred<any>();
  let reads = 0, changes = 0;
  const { auth, mocks } = context({ getRoomsForWindow: () => ++reads === 1 ? Promise.resolve({ data: null, error: "Falha exemplo" }) : pending.promise });
  const props = roomProps();
  props.currentReservedRoomId = room.id;
  props.selection.selectedRoomId = room.id;
  props.onSelectionChange = () => { changes++; };
  const screen = mountScreen("src/components/events/EventRoomSection.tsx", mocks, {}, props);
  t.after(screen.cleanup);
  await screen.flush();
  assert.match(content(screen), /Falha exemplo/);
  assert.equal(changes, 0);
  screen.findAll("TouchableOpacity").find((node) => textContent(node) === "Tentar novamente")!.props.onPress();
  await screen.flush();
  auth.sessionRevision++;
  pending.resolve({ data: [], error: null });
  await screen.flush();
  assert.equal(changes, 0);
  assert.equal(props.selection.selectedRoomId, room.id);
});

for (const scenario of ["unchanged", "removed", "replaced"] as const) {
  test(`event form preserves the ${scenario} room argument when saving its shared selection`, async (t) => {
    const { mocks } = context();
    const writes: any[] = [];
    const event = {
      id: "event-example", title: "Evento exemplo", category: "culto", description: null,
      location: null, is_public: false, start_at: window.startAt, end_at: window.endAt,
    };
    const screen = mountScreen("src/screens/app/CreateEventScreen.tsx", {
      ...mocks,
      eventService: { getEventEditorData: async () => ({ data: { event, visible_to_user_ids: [] }, error: null }) },
      roomReservationService: {
        getLinkedReservationForEvent: async () => ({ data: { room_id: room.id }, error: null }),
        getRoomsForWindow: async () => ({ data: [room], error: null }),
      },
      useEventStore: { useEventStore: () => ({
        isLoadingEvents: false,
        updateEventWithRoom: async (...args: any[]) => { writes.push(args); return { error: null }; },
      }) },
    }, {}, { route: { params: { mode: "edit", eventId: event.id } } });
    t.after(screen.cleanup);
    await screen.flush();
    const roomSection = screen.findAll("EventRoomSection")[0];
    assert.equal(roomSection.props.selection.selectedRoomId, room.id);
    if (scenario !== "unchanged") {
      roomSection.props.onSelectionChange({
        selectedRoomId: scenario === "removed" ? null : "new-room-example",
        hasManualRoomSelectionChange: true, isRoomSelectionAutoCleared: false,
      });
      await screen.flush();
    }
    screen.findAll("DefaultButton")[0].props.onPress();
    await screen.flush();
    assert.equal(writes.length, 1);
    assert.equal(writes[0][0], event.id);
    assert.equal(writes[0][1].title, event.title);
    assert.equal(writes[0][1].start_at, new Date(window.startAt).toISOString());
    assert.equal(writes[0][1].visible_to_user_ids.length, 0);
    assert.equal(writes[0][2], scenario === "unchanged" ? undefined : scenario === "removed" ? null : "new-room-example");
  });
}
