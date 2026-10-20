import test from "node:test";
import assert from "node:assert/strict";
import { deferred, mountScreen, textContent } from "./screenTestHelpers";
import * as participation from "../src/utils/scheduleParticipation";
import * as rules from "../src/utils/scheduleRules";

const event = { id: "event-example", title: "Evento exemplo", start_at: "2099-01-01T12:00:00Z", location: "Local exemplo" };
const ministry = { id: "ministry-example", name: "Ministério exemplo", is_leader: true };

test("list defaults to personal for a leader and ignores a stale focus scope", async () => {
  const oldScope = deferred<void>();
  const calls: any[] = [];
  let reads = 0;
  const scope = { userMinistries: [ministry], userMinistriesUserId: "user-example", error: null,
    fetchUserMinistries: async () => { if (++reads === 1) await oldScope.promise; } };
  const modules = screenModules(scope, {});
  const state = { scheduleCards: [], isLoadingSchedules: false, error: null,
    fetchScheduleCards: async (input: any) => { calls.push(input); } };
  modules.useScheduleStore = { useScheduleStore: Object.assign(() => state, { getState: () => ({ viewMode: "personal" }) }) } as any;
  const screen = mountScreen("src/screens/app/ScheduleScreen.tsx", modules);
  await screen.flush();
  screen.focus(false); await screen.flush();
  screen.focus(true); await screen.flush();
  oldScope.resolve(); await screen.flush();
  assert.equal(reads, 2);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].viewMode, "personal");
  assert.equal(calls[0].leaderMinistryIds[0], ministry.id);
  screen.cleanup();
});

function screenModules(scope: any, services: any) {
  const auth = { session: { user: { id: "user-example" } }, profile: { role: "leader" }, sessionRevision: 1 };
  const authStore = Object.assign(() => auth, { getState: () => auth });
  const ministryStore = Object.assign(() => scope, { getState: () => scope });
  return {
    useAuthStore: { useAuthStore: authStore },
    useMinistryStore: { useMinistryStore: ministryStore },
    useScheduleStore: { useScheduleStore: Object.assign(() => ({ fetchScheduleCards: async () => {} }), { getState: () => ({ viewMode: "personal" }) }) },
    scheduleService: services,
    scheduleRules: rules,
    scheduleParticipation: participation,
    formatDate: { formatDateTime: (value: string) => value },
    eventPermissions: { canManageEvents: () => false },
    "lucide-react-native": { ShieldAlert: "ShieldAlert" },
  };
}

test("ministry modal selection combines with search and period without refetching", async () => {
  const scope = { userMinistries: [ministry], userMinistriesUserId: "user-example", error: null, fetchUserMinistries: async () => {} };
  const modules = screenModules(scope, {});
  let reads = 0;
  const makeCard = (id: string, ministryId: string, start_at: string, title: string) => ({
    id, ministry: { id: ministryId, name: `Ministério ${ministryId}` }, event: { ...event, start_at, title }, my_assignments: [],
  });
  const state = { scheduleCards: [
    makeCard("future-a", "a", "2099-01-01T12:00:00Z", "Culto exemplo"),
    makeCard("past-a", "a", "2000-01-01T12:00:00Z", "Culto exemplo"),
    makeCard("past-b", "b", "2000-01-01T12:00:00Z", "Culto exemplo"),
    makeCard("past-other", "a", "2000-01-01T12:00:00Z", "Ensaio exemplo"),
  ], isLoadingSchedules: false, error: null, fetchScheduleCards: async () => { reads++; } };
  modules.useScheduleStore = { useScheduleStore: Object.assign(() => state, { getState: () => ({ viewMode: "personal" }) }) } as any;
  const screen = mountScreen("src/screens/app/ScheduleScreen.tsx", modules);
  await screen.flush();
  assert.equal(screen.findAll("ScheduleMinistryFilter").length, 1);
  screen.findAll("ScheduleMinistryFilter")[0].props.onSelect("a");
  screen.findAll("TextInput")[0].props.onChangeText("culto");
  screen.findAll("TouchableOpacity").find((node) => textContent(node) === "Anteriores")!.props.onPress();
  await screen.flush();
  assert.deepEqual(screen.findAll("FlatList")[0].props.data.map((card: any) => card.id), ["past-a"]);
  screen.findAll("ScheduleMinistryFilter")[0].props.onSelect(null);
  await screen.flush();
  assert.deepEqual(screen.findAll("FlatList")[0].props.data.map((card: any) => card.id), ["past-a", "past-b"]);
  screen.findAll("ScheduleMinistryFilter")[0].props.onSelect("b");
  await screen.flush();
  state.scheduleCards = state.scheduleCards.filter((card) => card.ministry.id === "a");
  screen.rerender();
  await screen.flush();
  assert.equal(screen.findAll("ScheduleMinistryFilter")[0].props.selectedId, null);
  assert.deepEqual(Array.from(screen.findAll("ScheduleMinistryFilter")[0].props.ministries, (item: any) => item.id), ["a"]);
  assert.deepEqual(screen.findAll("FlatList")[0].props.data.map((card: any) => card.id), ["past-a"]);
  assert.equal(reads, 1);
  screen.cleanup();
});

test("schedule actions retain creation permission and existing destinations", async () => {
  const scope: any = { userMinistries: [], userMinistriesUserId: "user-example", error: null, fetchUserMinistries: async () => {} };
  const modules = screenModules(scope, {});
  const state = { scheduleCards: [], isLoadingSchedules: false, error: null, fetchScheduleCards: async () => {} };
  modules.useScheduleStore = { useScheduleStore: Object.assign(() => state, { getState: () => ({ viewMode: "personal" }) }) } as any;
  const screen = mountScreen("src/screens/app/ScheduleScreen.tsx", modules);
  const destinations: string[] = [];
  (screen.navigation as any).navigate = (route: string) => { destinations.push(route); };
  await screen.flush();
  assert.equal(screen.findAll("ScheduleActions").length, 1);
  const actions = screen.findAll("ScheduleActions")[0].props;
  assert.equal(actions.canCreate, false);
  actions.onOpenSwaps();
  actions.onOpenBlockedDates();
  assert.deepEqual(destinations, ["SwapRequests", "BlockDatesScreen"]);
  scope.userMinistries = [ministry];
  screen.rerender();
  await screen.flush();
  assert.equal(screen.findAll("ScheduleActions")[0].props.canCreate, true);
  screen.findAll("ScheduleActions")[0].props.onCreate();
  assert.equal(destinations[2], "CreateSchedule");
  screen.cleanup();
});

test("detail reads assignments without querying management options for another ministry", async () => {
  let roles = 0, members = 0, reads = 0;
  const scope = { userMinistries: [{ ...ministry, id: "other-ministry" }], userMinistriesUserId: "user-example", error: null, fetchUserMinistries: async () => {} };
  const screen = mountScreen("src/screens/app/EditScheduleScreen.tsx", screenModules(scope, {
    getScheduleDetails: async () => { reads++; return { data: { id: "schedule-example", ministry_id: ministry.id, ministry, event }, error: null }; },
    getScheduleAssignmentsDetailed: async () => ({ data: [], error: null }),
    getMinistryRolesOptions: async () => { roles++; return { data: [], error: null }; },
    getMinistryMembersOptions: async () => { members++; return { data: [], error: null }; },
    getOwnPendingSwapRequestForAssignments: async () => ({ data: null, error: null }),
  }), { scheduleId: "schedule-example" });
  await screen.flush();
  assert.equal(screen.findAll("ScheduleSummaryCard").length, 1);
  assert.equal(roles, 0);
  assert.equal(members, 0);
  screen.focus(false); await screen.flush();
  screen.focus(true); await screen.flush();
  assert.equal(reads, 2);
  screen.cleanup();
});

test("detail discards a prior visit's late response", async () => {
  const old = deferred<any>();
  let reads = 0;
  const scope = { userMinistries: [], userMinistriesUserId: "user-example", error: null, fetchUserMinistries: async () => {} };
  const screen = mountScreen("src/screens/app/EditScheduleScreen.tsx", screenModules(scope, {
    getScheduleDetails: async () => ++reads === 1 ? old.promise : { data: { id: "schedule-example", ministry_id: ministry.id, ministry, event: { ...event, title: "Current visit" } }, error: null },
    getScheduleAssignmentsDetailed: async () => ({ data: [], error: null }),
    getOwnPendingSwapRequestForAssignments: async () => ({ data: null, error: null }),
  }), { scheduleId: "schedule-example" });
  await screen.flush();
  screen.focus(false); await screen.flush();
  screen.focus(true); await screen.flush();
  old.resolve({ data: { id: "schedule-example", ministry_id: ministry.id, ministry, event: { ...event, title: "Stale visit" } }, error: null });
  await screen.flush();
  assert.equal(screen.findAll("ScheduleSummaryCard")[0].props.eventTitle, "Current visit");
  screen.cleanup();
});

test("detail rereads a confirmation completed after returning to the same session", async () => {
  const write = deferred<void>();
  let status = "pending";
  let assignmentReads = 0;
  const scope = { userMinistries: [], userMinistriesUserId: "user-example", error: null, fetchUserMinistries: async () => {} };
  const modules = screenModules(scope, {
    getScheduleDetails: async () => ({ data: { id: "schedule-example", ministry_id: ministry.id, ministry, event }, error: null }),
    getScheduleAssignmentsDetailed: async () => {
      assignmentReads++;
      return { data: [{ id: "assignment-example", user_id: "user-example", status, role: { name: "Função exemplo" } }], error: null };
    },
    getOwnPendingSwapRequestForAssignments: async () => ({ data: null, error: null }),
    confirmMyAssignmentsForSchedule: async () => {
      await write.promise;
      status = "confirmed";
      return { error: null };
    },
  });
  const screen = mountScreen("src/screens/app/EditScheduleScreen.tsx", modules, { scheduleId: "schedule-example" });
  await screen.flush();
  const panel = screen.findAll("ScheduleTeamPanel")[0].props;
  const participation = mountScreen("src/components/schedule/MyScheduleParticipationCard.tsx", modules, {}, panel);
  await participation.flush();
  const confirmation = participation.findAll("DefaultButton").find((node) => node.props.children === "Confirmar")!.props.onPress();
  participation.cleanup();
  screen.focus(false); await screen.flush();
  screen.focus(true); await screen.flush();
  assert.equal(screen.findAll("ScheduleTeamPanel")[0].props.assignments[0].status, "pending");
  write.resolve();
  await confirmation;
  await screen.flush();
  assert.equal(status, "confirmed");
  assert.equal(screen.findAll("ScheduleTeamPanel")[0].props.assignments[0].status, "confirmed");
  assert.equal(assignmentReads, 3);
  assert.equal(screen.alerts.length, 0);
  screen.cleanup();
});

test("an old participation callback cannot replace assignments of another schedule", async () => {
  const reads: string[] = [];
  const scope = { userMinistries: [], userMinistriesUserId: "user-example", error: null, fetchUserMinistries: async () => {} };
  const params = { scheduleId: "schedule-a" };
  const screen = mountScreen("src/screens/app/EditScheduleScreen.tsx", screenModules(scope, {
    getScheduleDetails: async (id: string) => ({ data: { id, ministry_id: ministry.id, ministry, event }, error: null }),
    getScheduleAssignmentsDetailed: async (id: string) => {
      reads.push(id);
      return { data: [{ id: `assignment-${id}`, user_id: "user-example", status: "pending" }], error: null };
    },
  }), params);
  await screen.flush();
  const oldChanged = screen.findAll("ScheduleTeamPanel")[0].props.onChanged;
  params.scheduleId = "schedule-b";
  screen.rerender();
  await screen.flush();
  await oldChanged();
  await screen.flush();
  assert.equal(screen.findAll("ScheduleTeamPanel")[0].props.assignments[0].id, "assignment-schedule-b");
  assert.deepEqual(reads, ["schedule-a", "schedule-b"]);
  screen.cleanup();
});

test("creation opens the persisted schedule ID and retains valid context on focus", async () => {
  const auth = { session: { user: { id: "user-example" } }, profile: { role: "leader" }, sessionRevision: 1 };
  const authStore = Object.assign(() => auth, { getState: () => auth });
  const events = { events: [event], fetchUpcomingEvents: async () => {}, isLoadingEvents: false, error: null };
  let ministryReads = 0;
  const replacements: any[] = [];
  const screen = mountScreen("src/screens/app/CreateScheduleScreen.tsx", {
    useAuthStore: { useAuthStore: authStore },
    useEventStore: { useEventStore: Object.assign(() => events, { getState: () => events }) },
    useScheduleStore: { useScheduleStore: Object.assign(() => ({ fetchScheduleCards: async () => {} }), { getState: () => ({ viewMode: "personal" }) }) },
    ministryService: { getManageableMinistries: async () => { ministryReads++; return { data: [ministry], error: null }; } },
    scheduleService: { createScheduleValidated: async () => ({ data: { id: "persisted-schedule-example" }, error: null }) },
    scheduleRules: rules,
    formatDate: { formatDateTime: (value: string) => value },
    eventPermissions: { canManageEvents: () => false },
    "lucide-react-native": { ShieldAlert: "ShieldAlert" },
  });
  (screen.navigation as any).replace = (...args: any[]) => replacements.push(args);
  await screen.flush();
  const context = screen.findAll("ScheduleContextSection")[0];
  context.props.onSelectEvent(event.id);
  context.props.onSelectMinistry(ministry.id);
  await screen.flush();
  screen.focus(false); await screen.flush();
  screen.focus(true); await screen.flush();
  assert.equal(ministryReads, 2);
  const resumed = screen.findAll("ScheduleContextSection")[0];
  assert.equal(resumed.props.selectedEventId, event.id);
  assert.equal(resumed.props.selectedMinistryId, ministry.id);
  await resumed.props.onSubmit();
  await screen.flush();
  assert.equal(replacements.length, 1);
  assert.equal(replacements[0][0], "EditSchedule");
  assert.equal(replacements[0][1].scheduleId, "persisted-schedule-example");
  screen.cleanup();
});

for (const sessionChanged of [false, true]) {
  test(`late creation refreshes only its session's hub (sessionChanged=${sessionChanged})`, async () => {
    const write = deferred<any>();
    const auth = { session: { user: { id: "user-example" } }, profile: { role: "leader" }, sessionRevision: 1 };
    const events = { events: [event], fetchUpcomingEvents: async () => {}, isLoadingEvents: false, error: null };
    let refreshes = 0;
    let replacements = 0;
    const screen = mountScreen("src/screens/app/CreateScheduleScreen.tsx", {
      useAuthStore: { useAuthStore: Object.assign(() => auth, { getState: () => auth }) },
      useEventStore: { useEventStore: Object.assign(() => events, { getState: () => events }) },
      useScheduleStore: { useScheduleStore: Object.assign(() => ({ fetchScheduleCards: async () => { refreshes++; } }), { getState: () => ({ viewMode: "personal" }) }) },
      ministryService: { getManageableMinistries: async () => ({ data: [ministry], error: null }) },
      scheduleService: { createScheduleValidated: async () => write.promise },
      scheduleRules: rules,
      formatDate: { formatDateTime: (value: string) => value },
      eventPermissions: { canManageEvents: () => false },
      "lucide-react-native": { ShieldAlert: "ShieldAlert" },
    });
    (screen.navigation as any).replace = () => { replacements++; };
    await screen.flush();
    const context = screen.findAll("ScheduleContextSection")[0].props;
    context.onSelectEvent(event.id);
    context.onSelectMinistry(ministry.id);
    await screen.flush();
    const save = screen.findAll("ScheduleContextSection")[0].props.onSubmit();
    screen.focus(false);
    await screen.flush();
    if (sessionChanged) auth.sessionRevision++;
    write.resolve({ data: { id: "persisted-schedule-example" }, error: null });
    await save;
    await screen.flush();
    assert.equal(refreshes, sessionChanged ? 0 : 1);
    assert.equal(replacements, 0);
    assert.equal(screen.alerts.length, 0);
    screen.cleanup();
  });
}
