import { test } from "node:test";
import assert from "node:assert/strict";
import { mountScreen, deferred, textContent } from "./screenTestHelpers";

const member = { id: "member-example", ministry_id: "ministry-a", user_id: "user-example", full_name: "Pessoa exemplo", is_leader: false, capability_role_ids: ["role-example"], capability_roles: [{ id: "role-example", name: "Vocal" }] };
const role = { id: "role-example", name: "Vocal" };
const user = { id: "new-user", full_name: "Pessoa nova" };

function mountEditor(options: { member?: any; user?: any; scope?: () => Promise<any>; capabilities?: (id: string, roles: string[]) => Promise<any>; add?: () => Promise<any>; reload?: () => Promise<any>; leader?: (id: string, value: boolean) => Promise<any>; remove?: () => Promise<any> } = {}) {
  const auth = { profile: { role: "leader" }, session: { user: { id: "leader-example" } }, sessionRevision: 1 };
  let closed = 0, reloads = 0, refreshes = 0;
  const writes: any[] = [];
  const locks: boolean[] = [];
  const screen = mountScreen("src/components/ministry/MemberEditor.tsx", {
    DefaultButton: { __esModule: true, default: "DefaultButton" },
    useAuthStore: { useAuthStore: Object.assign(() => auth, { getState: () => auth }) },
    useMinistryStore: { useMinistryStore: () => ({ fetchUserMinistries: async () => { refreshes++; } }) },
    ministryService: {
      getManageableMinistries: options.scope ?? (async () => ({ data: [{ id: "ministry-a" }], error: null })),
      updateMinistryMemberLeaderStatus: options.leader ?? (async (...args: any[]) => { writes.push(args); return { error: null }; }),
      saveMinistryMemberCapabilities: options.capabilities ?? (async (...args: any[]) => { writes.push(args); return { error: null }; }),
      addUserToMinistry: options.add ?? (async () => ({ data: member, error: null })),
      removeUserFromMinistry: options.remove ?? (async () => { writes.push("remove"); return { error: null }; }),
    },
  }, {}, {
    member: options.member === undefined ? member : options.member, user: options.user ?? null,
    ministryId: "ministry-a", roles: [role], disabled: false, scopeError: null, canOperate: () => true,
    onReload: async () => { reloads++; return options.reload ? options.reload() : [member]; },
    onClose: () => { closed++; }, onBusyChange: (value: boolean) => locks.push(value),
  });
  const save = () => screen.findAll("DefaultButton").find((node) => /Salvar alterações|Adicionar ao ministério/.test(node.props.children))!.props.onPress();
  return { screen, save, writes, locks, auth, get closed() { return closed; }, get reloads() { return reloads; }, get refreshes() { return refreshes; } };
}

test("member editor sends an empty capabilities list without duplicate writes", async () => {
  const pending = deferred<any>();
  const calls: any[] = [];
  const view = mountEditor({ capabilities: async (id, roles) => { calls.push([id, roles]); return pending.promise; } });
  view.screen.findAll("TouchableOpacity").find((node) => textContent(node) === "Vocal")!.props.onPress();
  await view.screen.flush();
  const saving = view.save();
  await view.screen.flush();
  await view.save();
  assert.deepEqual(calls, [[member.id, []]]);
  assert.deepEqual(view.writes, [[member.id, false]]);
  pending.resolve({ error: null });
  await saving;
  await view.screen.flush();
  assert.equal(view.closed, 1);
  assert.deepEqual(view.locks, [true, false]);
  view.screen.cleanup();
});

test("member editor revalidates ministry scope before writing", async () => {
  const view = mountEditor({ scope: async () => ({ data: [], error: null }) });
  await view.save();
  await view.screen.flush();
  assert.deepEqual(view.writes, []);
  assert.equal(view.closed, 0);
  assert.match(view.screen.findAll("Text").map(textContent).join(" "), /Algumas alterações podem ter sido gravadas/);
  view.screen.cleanup();
});

test("a capabilities failure keeps the editor open and reconciles persisted leadership and functions", async () => {
  const view = mountEditor({ capabilities: async () => ({ error: "Falha parcial" }), reload: async () => [{ ...member, is_leader: true, capability_role_ids: [] }] });
  await view.save();
  await view.screen.flush();
  assert.equal(view.closed, 0);
  assert.ok(view.reloads > 0);
  assert.equal(view.screen.findAll("TouchableOpacity").find((node) => textContent(node) === "Vocal")!.props.style.backgroundColor, "#f3f4f6");
  assert.match(view.screen.findAll("Text").map(textContent).join(" "), /Este usuário será líder/);
  assert.equal(view.screen.alerts.some((args) => args[0] === "Sucesso"), false);
  view.screen.cleanup();
});

test("a partial capability write completed after refocus rereads persisted data without stale success", async () => {
  const pending = deferred<any>();
  const view = mountEditor({ capabilities: () => pending.promise, reload: async () => [{ ...member, capability_role_ids: [] }] });
  const saving = view.save();
  await view.screen.flush();
  view.screen.focus(false); await view.screen.flush();
  view.screen.focus(true); await view.screen.flush();
  pending.resolve({ error: "Falha após apagar capabilities" });
  await saving;
  await view.screen.flush();
  assert.ok(view.reloads > 0);
  assert.ok(view.refreshes > 0);
  assert.equal(view.screen.findAll("TouchableOpacity").find((node) => textContent(node) === "Vocal")!.props.style.backgroundColor, "#f3f4f6");
  assert.match(view.screen.findAll("Text").map(textContent).join(" "), /Algumas alterações podem ter sido gravadas/);
  assert.equal(view.closed, 0);
  assert.equal(view.screen.alerts.some((args) => args[0] === "Sucesso"), false);
  view.screen.cleanup();
});

test("an addition completed after refocus changes the add editor to the persisted member", async () => {
  const pending = deferred<any>();
  const persisted = { ...member, user_id: user.id, full_name: user.full_name, capability_role_ids: [] };
  const view = mountEditor({ member: null, user, add: () => pending.promise, reload: async () => [persisted] });
  const saving = view.save();
  await view.screen.flush();
  view.screen.focus(false); await view.screen.flush();
  view.screen.focus(true); await view.screen.flush();
  pending.resolve({ data: persisted, error: null });
  await saving;
  await view.screen.flush();
  assert.deepEqual(view.writes, []);
  assert.ok(view.screen.findAll("DefaultButton").some((node) => node.props.children === "Salvar alterações"));
  assert.equal(view.closed, 0);
  assert.equal(view.screen.alerts.some((args) => args[0] === "Sucesso"), false);
  view.screen.cleanup();
});

test("a removal confirmation from a previous visit cannot remove a member", async () => {
  const view = mountEditor();
  view.screen.findAll("DefaultButton").find((node) => node.props.children === "Remover do ministério")!.props.onPress();
  const confirm = view.screen.alerts.at(-1)![2].find((button: any) => button.text === "Remover");
  view.screen.focus(false); await view.screen.flush();
  view.screen.focus(true); await view.screen.flush();
  await confirm.onPress();
  assert.deepEqual(view.writes, []);
  view.screen.cleanup();
});

test("member save completion from another session cannot refresh or update the editor", async () => {
  const pending = deferred<any>();
  const view = mountEditor({ capabilities: () => pending.promise });
  const saving = view.save();
  await view.screen.flush();
  view.auth.sessionRevision++;
  pending.resolve({ error: null });
  await saving;
  await view.screen.flush();
  assert.equal(view.reloads, 0);
  assert.equal(view.refreshes, 0);
  assert.equal(view.closed, 0);
  view.screen.cleanup();
});

test("member removal refreshes shared data and reports success", async () => {
  const view = mountEditor();
  view.screen.findAll("DefaultButton").find((node) => node.props.children === "Remover do ministério")!.props.onPress();
  await view.screen.alerts.at(-1)![2].find((button: any) => button.text === "Remover").onPress();
  await view.screen.flush();
  assert.deepEqual(view.writes, ["remove"]);
  assert.equal(view.closed, 1);
  assert.equal(view.reloads, 1);
  assert.equal(view.refreshes, 1);
  assert.ok(view.screen.alerts.some((args) => args[0] === "Sucesso"));
  view.screen.cleanup();
});

test("a removal completed after refocus refreshes shared data without stale success", async () => {
  const pending = deferred<any>();
  const view = mountEditor({ remove: () => pending.promise });
  view.screen.findAll("DefaultButton").find((node) => node.props.children === "Remover do ministério")!.props.onPress();
  const removing = view.screen.alerts.at(-1)![2].find((button: any) => button.text === "Remover").onPress();
  await view.screen.flush();
  view.screen.focus(false); await view.screen.flush();
  view.screen.focus(true); await view.screen.flush();
  pending.resolve({ error: null });
  await removing;
  await view.screen.flush();
  assert.equal(view.closed, 1);
  assert.equal(view.reloads, 1);
  assert.equal(view.refreshes, 1);
  assert.equal(view.screen.alerts.some((args) => args[0] === "Sucesso"), false);
  view.screen.cleanup();
});

test("removal remains locked through reread and closes after refocus during that reread", async () => {
  const reload = deferred<any>();
  const view = mountEditor({ reload: () => reload.promise });
  view.screen.findAll("DefaultButton").find((node) => node.props.children === "Remover do ministério")!.props.onPress();
  const removing = view.screen.alerts.at(-1)![2].find((button: any) => button.text === "Remover").onPress();
  await view.screen.flush();
  assert.deepEqual(view.locks, [true], "shared controls remain locked during the reread");
  await view.save();
  view.screen.findAll("TouchableOpacity").find((node) => textContent(node) === "Fechar")!.props.onPress();
  assert.deepEqual(view.writes, ["remove"]);
  assert.equal(view.closed, 0);
  view.screen.focus(false); await view.screen.flush();
  view.screen.focus(true); await view.screen.flush();
  reload.resolve([]);
  await removing;
  await view.screen.flush();
  assert.equal(view.closed, 1, "the removed member cannot remain open after refocus");
  assert.equal(view.refreshes, 1);
  assert.deepEqual(view.locks, [true, false]);
  assert.equal(view.screen.alerts.some((args) => args[0] === "Sucesso"), false);
  view.screen.cleanup();
});

test("removal releases the shared lock if reread throws", async () => {
  const view = mountEditor({ reload: async () => { throw new Error("Erro de rede ficticio"); } });
  view.screen.findAll("DefaultButton").find((node) => node.props.children === "Remover do ministério")!.props.onPress();
  await assert.rejects(view.screen.alerts.at(-1)![2].find((button: any) => button.text === "Remover").onPress());
  await view.screen.flush();
  assert.deepEqual(view.locks, [true, false]);
  assert.equal(view.screen.findAll("DefaultButton").find((node) => node.props.children === "Salvar alterações")!.props.isLoading, false);
  view.screen.cleanup();
});

test("a failed removal leaves the editor available and preserves its draft", async () => {
  const view = mountEditor({ remove: async () => ({ error: "Erro de rede" }) });
  view.screen.findAll("TouchableOpacity").find((node) => textContent(node) === "Vocal")!.props.onPress();
  await view.screen.flush();
  view.screen.findAll("DefaultButton").find((node) => node.props.children === "Remover do ministério")!.props.onPress();
  await view.screen.alerts.at(-1)![2].find((button: any) => button.text === "Remover").onPress();
  await view.screen.flush();
  assert.equal(view.closed, 0);
  assert.equal(view.screen.findAll("TouchableOpacity").find((node) => textContent(node) === "Vocal")!.props.style.backgroundColor, "#f3f4f6");
  assert.ok(view.screen.alerts.some((args) => args[0] === "Nao foi possivel remover o membro"));
  view.screen.cleanup();
});

function mountSearch(search: (query: string) => Promise<any>) {
  const auth = { sessionRevision: 1 };
  const screen = mountScreen("src/components/ministry/MemberSearch.tsx", {
    useAuthStore: { useAuthStore: Object.assign(() => auth, { getState: () => auth }) },
    ministryService: { searchRegisteredUsers: search },
  }, {}, { ministryId: "ministry-a", members: [member], disabled: false, canOperate: () => true, onSelect() {} });
  screen.findAll("TouchableOpacity").find((node) => textContent(node) === "Adicionar integrante")!.props.onPress();
  return { screen, auth };
}

test("debounced member search discards an older query and filters current members", async () => {
  const old = deferred<any>();
  const queries: string[] = [];
  const { screen } = mountSearch((query) => {
    queries.push(query);
    return query === "antiga" ? old.promise : Promise.resolve({ data: [user, { id: member.user_id, full_name: member.full_name }], error: null });
  });
  await screen.flush();
  screen.findAll("TextInput")[0].props.onChangeText("antiga");
  await screen.flush();
  assert.deepEqual(queries, []);
  await new Promise((resolve) => setTimeout(resolve, 275));
  screen.findAll("TextInput")[0].props.onChangeText("nova");
  await screen.flush();
  await new Promise((resolve) => setTimeout(resolve, 275));
  await screen.flush();
  old.resolve({ data: [{ id: "old-user", full_name: "Pessoa antiga" }], error: null });
  await screen.flush();
  const content = screen.findAll("Text").map(textContent).join(" ");
  assert.match(content, /Pessoa nova/);
  assert.doesNotMatch(content, /Pessoa antiga|Pessoa exemplo/);
  assert.deepEqual(queries, ["antiga", "nova"]);
  screen.cleanup();
});

test("member search ignores a pending result after blur", async () => {
  const pending = deferred<any>();
  const { screen } = mountSearch(() => pending.promise);
  await screen.flush();
  screen.findAll("TextInput")[0].props.onChangeText("nova");
  await screen.flush();
  await new Promise((resolve) => setTimeout(resolve, 275));
  screen.focus(false); await screen.flush();
  pending.resolve({ data: [user], error: null });
  await screen.flush();
  assert.doesNotMatch(screen.findAll("Text").map(textContent).join(" "), /Pessoa nova/);
  screen.cleanup();
});
