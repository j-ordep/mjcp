import test from "node:test";
import assert from "node:assert/strict";
import { deferred, mountScreen, textContent } from "./screenTestHelpers";

const details = {
  id: "schedule-example", ministry_id: "ministry-example",
  ministry: { id: "ministry-example", name: "Equipe exemplo" },
  event: { id: "event-example", title: "Evento exemplo", start_at: "2099-01-01T12:00:00Z" },
};
const person = { user_id: "user-example", full_name: "Pessoa exemplo", capability_role_ids: ["role-example"] };
const role = { id: "role-example", name: "Vocal" };
const assignment = { id: "assignment-example", user_id: "user-example", role: { name: "Vocal" }, status: "pending" };

function modules(services: Record<string, unknown> = {}) {
  const auth = { session: { user: { id: "user-example" } }, profile: { role: "leader" }, sessionRevision: 1 };
  return {
    auth,
    mocks: {
      useAuthStore: { useAuthStore: Object.assign(() => auth, { getState: () => auth }) },
      scheduleService: {
        getMinistryMembersOptions: async () => ({ data: [person], error: null }),
        getMinistryRolesOptions: async () => ({ data: [role], error: null }),
        getAssignmentWarningsForSchedule: async () => ({ data: [], error: null }),
        upsertScheduleAssignmentValidated: async () => ({ error: null }),
        getOwnPendingSwapRequestForAssignments: async () => ({ data: null, error: null }),
        getSwapCandidatesForAssignment: async () => ({ data: [], error: null }),
        createSwapRequest: async () => ({ data: { id: "request-example" }, error: null }),
        confirmMyAssignmentsForSchedule: async () => ({ error: null }),
        ...services,
      },
    },
  };
}

function chooseAssignment(screen: ReturnType<typeof mountScreen>) {
  screen.findAll("TouchableOpacity").find((node) => textContent(node).includes("Pessoa exemplo"))!.props.onPress();
}

test("assignment picker loads no management options while hidden or unauthorized", async () => {
  let reads = 0;
  const { mocks } = modules({ getMinistryMembersOptions: async () => { reads++; return { data: [], error: null }; } });
  for (const props of [{ visible: false, canManage: () => true }, { visible: true, canManage: () => false }]) {
    const screen = mountScreen("src/components/schedule/AssignmentPickerModal.tsx", mocks, {}, {
      ...props, details, assignedMemberIds: [], onClose() {}, onChanged: async () => {},
    });
    await screen.flush();
    screen.cleanup();
  }
  assert.equal(reads, 0);
});

test("assignment warnings keep confirmation and recheck the start before insertion", async () => {
  let writes = 0;
  const { mocks } = modules({
    getAssignmentWarningsForSchedule: async () => ({ data: [{ type: "blocked_date", date: "2099-01-01", reason: "Exemplo" }], error: null }),
    upsertScheduleAssignmentValidated: async () => { writes++; return { error: null }; },
  });
  const context = { ...details, event: { ...details.event } };
  const screen = mountScreen("src/components/schedule/AssignmentPickerModal.tsx", mocks, {}, {
    visible: true, details: context, assignedMemberIds: [], canManage: () => true, onClose() {}, onChanged: async () => {},
  });
  await screen.flush();
  chooseAssignment(screen);
  await screen.flush();
  screen.findAll("TouchableOpacity").find((node) => textContent(node) === "Vocal")!.props.onPress();
  await screen.flush();
  await screen.findAll("DefaultButton")[0].props.onPress();
  await screen.flush();
  assert.equal(writes, 0);
  const confirmation = screen.alerts.at(-1)![2].find((button: any) => button.text === "Escalar mesmo assim");
  context.event.start_at = "2000-01-01T12:00:00Z";
  await confirmation.onPress();
  assert.equal(writes, 0);
  screen.cleanup();
});

test("assignment write failure preserves the selected member and role", async () => {
  let closes = 0, changes = 0;
  const { mocks } = modules({ upsertScheduleAssignmentValidated: async () => ({ error: "Falha exemplo" }) });
  const screen = mountScreen("src/components/schedule/AssignmentPickerModal.tsx", mocks, {}, {
    visible: true, details, assignedMemberIds: [], canManage: () => true,
    onClose: () => { closes++; }, onChanged: async () => { changes++; },
  });
  await screen.flush();
  chooseAssignment(screen);
  await screen.flush();
  screen.findAll("TouchableOpacity").find((node) => textContent(node) === "Vocal")!.props.onPress();
  await screen.flush();
  await screen.findAll("DefaultButton")[0].props.onPress();
  await screen.flush();
  assert.equal(closes, 0);
  assert.equal(changes, 0);
  assert.equal(screen.findAll("DefaultButton")[0].props.disabled, false);
  assert.match(screen.findAll("Text").map(textContent).join(" "), /Pessoa exemplo/);
  assert.equal(screen.alerts.at(-1)![0], "Nao foi possivel adicionar na escala");
  screen.cleanup();
});

test("participation owns the swap reason and reports a persisted request to the parent", async () => {
  const requests: any[] = [];
  let changes = 0;
  const { mocks } = modules({ createSwapRequest: async (input: unknown) => {
    requests.push(input); return { data: { id: "request-example" }, error: null };
  } });
  const screen = mountScreen("src/components/schedule/MyScheduleParticipationCard.tsx", mocks, {}, {
    details, assignments: [assignment], onChanged: async () => { changes++; },
  });
  await screen.flush();
  await screen.findAll("DefaultButton").find((node) => node.props.children === "Preciso trocar")!.props.onPress();
  await screen.flush();
  screen.findAll("RequestSwapModal")[0].props.onChangeReason("Motivo fictício");
  await screen.flush();
  await screen.findAll("RequestSwapModal")[0].props.onSubmit();
  await screen.flush();
  assert.equal(requests.length, 1);
  assert.equal(requests[0].fromAssignmentId, assignment.id);
  assert.equal(requests[0].reason, "Motivo fictício");
  assert.equal(changes, 1);
  assert.equal(screen.findAll("RequestSwapModal")[0].props.visible, false);
  screen.cleanup();
});

test("swap candidate response for a previous assignment cannot overwrite the selected one", async () => {
  const old = deferred<any>();
  const { mocks } = modules({ getSwapCandidatesForAssignment: (id: string) => id === assignment.id
    ? old.promise : Promise.resolve({ data: [{ user_id: "candidate-current", full_name: "Pessoa atual" }], error: null }) });
  const screen = mountScreen("src/components/schedule/MyScheduleParticipationCard.tsx", mocks, {}, {
    details, assignments: [assignment, { ...assignment, id: "assignment-other" }], onChanged: async () => {},
  });
  await screen.flush();
  await screen.findAll("DefaultButton").find((node) => node.props.children === "Preciso trocar")!.props.onPress();
  await screen.flush();
  screen.findAll("RequestSwapModal")[0].props.onSelectAssignment("assignment-other");
  await screen.flush();
  old.resolve({ data: [{ user_id: "candidate-old", full_name: "Pessoa anterior" }], error: null });
  await screen.flush();
  assert.equal(screen.findAll("RequestSwapModal")[0].props.candidates[0].user_id, "candidate-current");
  screen.cleanup();
});

test("confirmation from an old session never refreshes the new account", async () => {
  const old = deferred<any>();
  let changes = 0;
  const { mocks, auth } = modules({ confirmMyAssignmentsForSchedule: () => old.promise });
  const screen = mountScreen("src/components/schedule/MyScheduleParticipationCard.tsx", mocks, {}, {
    details, assignments: [assignment], onChanged: async () => { changes++; },
  });
  await screen.flush();
  const confirmation = screen.findAll("DefaultButton").find((node) => node.props.children === "Confirmar")!.props.onPress();
  auth.sessionRevision++;
  auth.session.user.id = "another-user";
  old.resolve({ error: null });
  await confirmation;
  assert.equal(changes, 0);
  assert.equal(screen.alerts.length, 0);
  screen.cleanup();
});

test("team removal confirmation expires when leaving the visit", async () => {
  let writes = 0;
  const { mocks } = modules({ removeScheduleAssignment: async () => { writes++; return { error: null }; } });
  const screen = mountScreen("src/components/schedule/ScheduleTeamPanel.tsx", mocks, {}, {
    details, assignments: [assignment], canManage: () => true, onChanged: async () => {},
  });
  await screen.flush();
  await screen.findAll("ScheduleAssignmentList")[0].props.handleRemoveAssignment(assignment.id);
  const confirmation = screen.alerts.at(-1)![2].find((button: any) => button.text === "Remover");
  screen.focus(false); await screen.flush();
  screen.focus(true); await screen.flush();
  await confirmation.onPress();
  assert.equal(writes, 0);
  screen.cleanup();
});
