import { test } from "node:test";
import assert from "node:assert/strict";
import { mountScreen, deferred, textContent } from "./screenTestHelpers";

const ministries = [{ id: "ministry-a", name: "Equipe A" }, { id: "ministry-b", name: "Equipe B" }];
const member = (id: string, name: string) => ({ id: `member-${id}`, ministry_id: id, user_id: `user-${id}`, full_name: name, is_leader: false, capability_role_ids: ["role-example"], capability_roles: [{ id: "role-example", name: "Vocal" }] });

function mount(options: { routeId?: string; getMembers?: (id: string) => Promise<any>; scope?: () => Promise<any> } = {}) {
  const reads: string[] = [];
  const auth = { profile: { role: "member" }, session: { user: { id: "leader-example" } }, sessionRevision: 1 };
  const useAuthStore = Object.assign(() => auth, { getState: () => auth });
  const screen = mountScreen("src/screens/app/ManageMinistryMembersScreen.tsx", {
    useAuthStore: { useAuthStore },
    useMinistryStore: { useMinistryStore: () => ({ fetchUserMinistries: async () => {} }) },
    ministryService: {
      getManageableMinistries: options.scope ?? (async () => ({ data: ministries, error: null })),
      getMinistryMembersDetailed: async (id: string) => {
        reads.push(id);
        return options.getMembers ? options.getMembers(id) : { data: [member(id, id === "ministry-a" ? "Pessoa A" : "Pessoa B")], error: null };
      },
    },
    scheduleService: { getMinistryRolesOptions: async () => ({ data: [{ id: "role-example", name: "Vocal" }], error: null }) },
  }, options.routeId ? { ministryId: options.routeId } : {});
  return { screen, reads, auth };
}

test("team rejects another ministry supplied by the route before querying its members", async () => {
  const { screen, reads } = mount({ routeId: "not-led" });
  await screen.flush();
  assert.deepEqual(reads, []);
  assert.equal(screen.findAll("MemberSearch").length, 0);
  screen.cleanup();
});

test("ordinary members never query team data without a manageable ministry", async () => {
  const { screen, reads } = mount({ scope: async () => ({ data: [], error: null }) });
  await screen.flush();
  assert.deepEqual(reads, []);
  screen.cleanup();
});

test("switching ministry discards the previous ministry response", async () => {
  const old = deferred<any>();
  const { screen } = mount({ getMembers: (id) => id === "ministry-a" ? old.promise : Promise.resolve({ data: [member(id, "Pessoa B")], error: null }) });
  await screen.flush();
  screen.findAll("TouchableOpacity").find((node) => textContent(node) === "Equipe B")!.props.onPress();
  await screen.flush();
  old.resolve({ data: [member("ministry-a", "Pessoa A")], error: null });
  await screen.flush();
  const content = screen.findAll("Text").map(textContent).join(" ");
  assert.match(content, /Pessoa B/);
  assert.doesNotMatch(content, /Pessoa A/);
  assert.ok(screen.findAll("MemberSearch")[0], "search owns its interaction state in a child component");
  assert.equal(screen.findAll("MemberSearch")[0].props.ministryId, "ministry-b");
  screen.cleanup();
});

test("team passes shared scope and reload to the editor and locks ministry changes during its write", async () => {
  const { screen, reads } = mount();
  await screen.flush();
  screen.findAll("TouchableOpacity").find((node) => textContent(node).includes("Pessoa A"))!.props.onPress();
  await screen.flush();
  const editor = screen.findAll("MemberEditor")[0];
  assert.ok(editor, "member editing belongs to its own component");
  assert.equal(editor.props.member.user_id, "user-ministry-a");
  assert.equal(editor.props.ministryId, "ministry-a");
  editor.props.onBusyChange(true);
  screen.findAll("TouchableOpacity").find((node) => textContent(node) === "Equipe B")!.props.onPress();
  await screen.flush();
  assert.equal(screen.findAll("MemberEditor")[0].props.ministryId, "ministry-a");
  editor.props.onBusyChange(false);
  const before = reads.length;
  assert.equal((await editor.props.onReload())[0].user_id, "user-ministry-a");
  assert.ok(reads.length > before);
  editor.props.onClose();
  await screen.flush();
  assert.equal(screen.findAll("MemberEditor").length, 0);
  screen.cleanup();
});

test("search selection opens a new-user editor and old callbacks lose session authorization", async () => {
  const { screen, auth } = mount();
  await screen.flush();
  const search = screen.findAll("MemberSearch")[0];
  assert.ok(search, "new-member search belongs to its own component");
  search.props.onSelect({ id: "new-user", full_name: "Pessoa nova" });
  await screen.flush();
  const editor = screen.findAll("MemberEditor")[0];
  assert.equal(editor.props.user.id, "new-user");
  assert.equal(editor.props.canOperate(), true);
  auth.sessionRevision++;
  assert.equal(editor.props.canOperate(), false);
  screen.cleanup();
});

test("scope failure keeps the search mounted for retry while disabling access", async () => {
  let fail = false;
  const { screen } = mount({ scope: async () => fail ? { error: "Falha ficticia", data: null } : { data: ministries, error: null } });
  await screen.flush();
  const before = screen.findAll("MemberSearch")[0];
  fail = true;
  screen.findAll("TouchableOpacity").find((node) => textContent(node) === "Atualizar equipe")!.props.onPress();
  await screen.flush();
  const pending = screen.findAll("MemberSearch")[0];
  assert.ok(pending, "search state survives scope errors");
  assert.equal(pending.key, before.key);
  assert.equal(pending.props.disabled, true);
  assert.equal(pending.props.canOperate(), false);
  fail = false;
  screen.findAll("TouchableOpacity").find((node) => textContent(node) === "Atualizar equipe")!.props.onPress();
  await screen.flush();
  assert.equal(screen.findAll("MemberSearch")[0].key, before.key);
  assert.equal(screen.findAll("MemberSearch")[0].props.canOperate(), true);
  screen.cleanup();
});

test("callbacks from an earlier session cannot unlock or close a new member editor", async () => {
  const { screen, auth } = mount();
  await screen.flush();
  screen.findAll("TouchableOpacity").find((node) => textContent(node).includes("Pessoa A"))!.props.onPress();
  await screen.flush();
  const previous = screen.findAll("MemberEditor")[0];
  previous.props.onBusyChange(true);
  auth.sessionRevision++;
  screen.rerender();
  await screen.flush();
  assert.equal(screen.findAll("MemberEditor").length, 0, "old-session targets are cleared");
  screen.findAll("TouchableOpacity").find((node) => textContent(node).includes("Pessoa A"))!.props.onPress();
  await screen.flush();
  const current = screen.findAll("MemberEditor")[0];
  current.props.onBusyChange(true);
  previous.props.onBusyChange(false);
  previous.props.onClose();
  await screen.flush();
  assert.equal(screen.findAll("MemberEditor").length, 1);
  assert.equal(screen.findAll("TouchableOpacity").find((node) => textContent(node) === "Equipe B")!.props.disabled, true);
  current.props.onBusyChange(false);
  current.props.onClose();
  await screen.flush();
  assert.equal(screen.findAll("MemberEditor").length, 0);
  screen.cleanup();
});
