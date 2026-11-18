import test from "node:test";
import assert from "node:assert/strict";
import { deferred, mountScreen, textContent } from "./screenTestHelpers";
import { getChurchDate, getMonthDays } from "../src/utils/monthlySchedule";

const ministry = { id: "ministry-example", name: "Louvor exemplo", is_leader: true };
const other = { ...ministry, id: "other-example", name: "Recepção exemplo" };

function setup(options: { role?: string; ministries?: any[]; read?: () => Promise<any> } = {}) {
  const auth = { session: { user: { id: "user-example" } }, profile: { role: options.role ?? "member" }, sessionRevision: 1 };
  let writes = 0;
  const legacyEvents = { events: [], fetchUpcomingEvents: async () => {}, isLoadingEvents: false, error: null };
  const legacySchedules = { fetchScheduleCards: async () => {} };
  const screen = mountScreen("src/screens/app/CreateScheduleScreen.tsx", {
    useAuthStore: { useAuthStore: Object.assign(() => auth, { getState: () => auth }) },
    ministryService: { getManageableMinistries: options.read ?? (async () => ({ data: options.ministries ?? [ministry], error: null })) },
    // Legacy dependencies must never be used by the new preview.
    useEventStore: { useEventStore: Object.assign(() => legacyEvents, { getState: () => legacyEvents }) },
    useScheduleStore: { useScheduleStore: () => legacySchedules },
    scheduleService: { createScheduleValidated: async () => { writes++; return { data: { id: "example" }, error: null }; } },
    eventPermissions: { canManageEvents: () => false },
    "react-native-calendars": { Calendar: "Calendar", LocaleConfig: { locales: {} } },
    "lucide-react-native": { ShieldAlert: "ShieldAlert", Trash2: "Trash2" },
  });
  return { screen, auth, writes: () => writes };
}

const action = (screen: ReturnType<typeof mountScreen>, label: string) => screen.findAll("Button").find((node) => node.props.accessibilityLabel === label)!;
const calendar = (screen: ReturnType<typeof mountScreen>) => screen.findAll("Calendar")[0].props;

test("church date and civil month arithmetic handle midnight and leap years", () => {
  assert.equal(getChurchDate(new Date("2028-03-01T02:59:59Z")), "2028-02-29");
  assert.equal(getChurchDate(new Date("2028-03-01T03:00:00Z")), "2028-03-01");
  assert.equal(getMonthDays("2028-02").length, 29);
  assert.equal(getMonthDays("2027-02").length, 28);
  assert.equal(getMonthDays("2028-12").at(-1)?.date, "2028-12-31");
  assert.deepEqual(getMonthDays("2028-13"), []);
});

test("one led ministry is fixed and monthly preview has no event selection", async () => {
  const { screen } = setup();
  await screen.flush();
  assert.equal(screen.findAll("View").filter((node) => node.props.testID === "fixed-ministry").length, 1);
  assert.equal(screen.findAll("SelectField").length, 0);
  assert.equal(screen.findAll("ScheduleContextSection").length, 0);
  assert.equal(calendar(screen).hideExtraDays, true);
  assert.equal(action(screen, "Ver prévia").props.disabled, true);
  screen.cleanup();
});

test("admin selects any ministry; leaders only see ministries they lead", async () => {
  const { screen } = setup({ role: "admin", ministries: [ministry, other] });
  await screen.flush();
  const select = screen.findAll("SelectField")[0].props;
  assert.equal(select.value, null);
  assert.equal(select.options.length, 2);
  select.onValueChange(other.id);
  await screen.flush();
  assert.equal(screen.findAll("SelectField")[0].props.value, other.id);
  screen.cleanup();

  const leader = setup({ ministries: [ministry, { ...other, is_leader: false }] }).screen;
  await leader.flush();
  assert.equal(leader.findAll("SelectField").length, 0);
  assert.ok(leader.findAll("View").some((node) => node.props.testID === "fixed-ministry" && textContent(node).includes(ministry.name)));
  leader.cleanup();

  const member = setup({ role: "leader", ministries: [{ ...ministry, is_leader: false }] }).screen;
  await member.flush();
  assert.equal(member.findAll("Calendar").length, 0);
  assert.ok(member.findAll("Text").some((node) => textContent(node).includes("Sem permissão")));
  member.cleanup();
});

test("weekly shortcut includes leap day, allows exceptions, and previews without saving", async () => {
  const { screen, writes } = setup();
  await screen.flush();
  calendar(screen).onMonthChange({ dateString: "2028-02-01" });
  await screen.flush();
  action(screen, "Selecionar terças-feiras").props.onPress();
  await screen.flush();
  assert.deepEqual(Object.keys(calendar(screen).markedDates).sort(), ["2028-02-01", "2028-02-08", "2028-02-15", "2028-02-22", "2028-02-29"]);
  calendar(screen).onDayPress({ dateString: "2028-02-08" });
  calendar(screen).onDayPress({ dateString: "2028-02-06" });
  calendar(screen).onDayPress({ dateString: "2028-03-01" });
  calendar(screen).onDayPress({ dateString: "2028-02-30" });
  await screen.flush();
  assert.deepEqual(Object.keys(calendar(screen).markedDates).sort(), ["2028-02-01", "2028-02-06", "2028-02-15", "2028-02-22", "2028-02-29"]);
  action(screen, "Ver prévia").props.onPress();
  await screen.flush();
  const times = screen.findAll("TextInput").filter((node) => node.props.accessibilityLabel?.startsWith("Horário de "));
  assert.equal(times.length, 5);
  times[0].props.onChangeText("19:30");
  await screen.flush();
  assert.equal(screen.findAll("TextInput")[0].props.value, "19:30");
  assert.equal(writes(), 0);
  assert.ok(screen.findAll("Text").some((node) => textContent(node).includes("não é salva")));
  calendar(screen).onMonthChange({ dateString: "2028-03-01" });
  await screen.flush();
  assert.deepEqual(Object.keys(calendar(screen).markedDates), []);
  assert.equal(screen.findAll("TextInput").length, 0);
  screen.cleanup();
});

test("ministry errors are retryable and late responses cannot restore an old session", async () => {
  const old = deferred<any>();
  let reads = 0;
  const { screen, auth } = setup({ read: async () => ++reads === 1 ? old.promise : { data: [], error: "Falha de leitura" } });
  await screen.flush();
  auth.sessionRevision++;
  auth.session.user.id = "another-user-example";
  screen.rerender();
  await screen.flush();
  old.resolve({ data: [ministry], error: null });
  await screen.flush();
  assert.equal(screen.findAll("Calendar").length, 0);
  assert.ok(action(screen, "Tentar novamente"));
  screen.cleanup();
});

test("refocusing retains valid days but changing the led ministry clears its preview", async () => {
  let available = [ministry];
  const { screen } = setup({ read: async () => ({ data: available, error: null }) });
  await screen.flush();
  calendar(screen).onMonthChange({ dateString: "2028-02-01" });
  await screen.flush();
  calendar(screen).onDayPress({ dateString: "2028-02-06" });
  await screen.flush();
  screen.focus(false); await screen.flush();
  screen.focus(true); await screen.flush();
  assert.deepEqual(Object.keys(calendar(screen).markedDates), ["2028-02-06"]);
  available = [other];
  screen.focus(false); await screen.flush();
  screen.focus(true); await screen.flush();
  assert.deepEqual(Object.keys(calendar(screen).markedDates), []);
  screen.cleanup();
});
