import test from "node:test";
import assert from "node:assert/strict";
import { createQueryBuilder, loadServiceModule } from "./serviceTestHelpers";

type ScheduleService = typeof import("../src/services/scheduleService");

const event = {
  id: "event-example",
  title: "Evento de exemplo",
  start_at: "2030-01-01T18:00:00.000Z",
  location: null,
  description: null,
};
const ministry = { id: "ministry-example", name: "Ministério de exemplo" };
const createdAt = "2029-12-01T00:00:00.000Z";

function loadCardService(table: string, data: unknown, error?: { message: string }) {
  const filters: unknown[][] = [];
  const orders: unknown[][] = [];
  const builder = createQueryBuilder({ select: { data, error } });
  builder.eq = (...args: unknown[]) => { filters.push(args); return builder; };
  builder.in = (...args: unknown[]) => { filters.push(args); return builder; };
  builder.order = (...args: unknown[]) => { orders.push(args); return builder; };
  const service = loadServiceModule<ScheduleService>("../src/services/scheduleService", {
    from(actualTable: string) { assert.equal(actualTable, table); return builder; },
  });
  return { service, filters, orders };
}

test("manageable cards keep ministry scoping, date ordering and participation", async () => {
  const laterEvent = { ...event, id: "later-example", start_at: "2030-01-02T18:00:00.000Z" };
  const { service, filters, orders } = loadCardService("schedules", [
    {
      id: "later-schedule", created_at: createdAt, events: [laterEvent],
      ministries: [ministry], schedule_assignments: null,
    },
    {
      id: "missing-schedule", created_at: createdAt, events: [],
      ministries: ministry, schedule_assignments: [],
    },
    {
      id: "schedule-example", created_at: createdAt, events: event,
      ministries: ministry,
      schedule_assignments: [
        { id: "mine", user_id: "user-example", role_id: "role-example", status: "pending", ministry_roles: [] },
        { id: "other", user_id: "other-example", role_id: "role-example", status: "confirmed", ministry_roles: { name: "Função de exemplo" } },
      ],
    },
  ]);

  const result = await service.getManageableScheduleCards("user-example", [ministry.id]);
  assert.equal(result.error, null);
  assert.deepEqual(filters, [["ministry_id", [ministry.id]]]);
  assert.deepEqual(orders, [["created_at", { ascending: false }]]);
  assert.deepEqual(result.data?.map((card) => card.id), ["schedule-example", "later-schedule"]);
  assert.deepEqual(result.data?.[0], {
    id: "schedule-example", created_at: createdAt, event, ministry,
    team: { total: 2, pending: 1, confirmed: 1 },
    my_assignments: [{ id: "mine", role_id: "role-example", role_name: "Função", status: "pending" }],
    can_manage: true,
  });
});

test("personal cards keep user scoping, grouped assignments and team counts", async () => {
  const schedule = {
    id: "schedule-example", created_at: createdAt, events: [event], ministries: [ministry],
    schedule_assignments: [{ id: "mine", status: "pending" }, { id: "other", status: "confirmed" }],
  };
  const { service, filters } = loadCardService("schedule_assignments", [
    { id: "mine", schedule_id: schedule.id, role_id: "role-1", status: "pending", ministry_roles: [{ name: "Função 1" }], schedules: [schedule] },
    { id: "second", schedule_id: schedule.id, role_id: "role-2", status: "confirmed", ministry_roles: { name: "Função 2" }, schedules: schedule },
    { id: "missing", schedule_id: schedule.id, role_id: "role-3", status: "pending", ministry_roles: null, schedules: schedule },
  ]);

  const result = await service.getUserScheduleCards("user-example");
  assert.equal(result.error, null);
  assert.deepEqual(filters, [["user_id", "user-example"]]);
  assert.deepEqual(result.data, [{
    id: schedule.id, created_at: createdAt, event, ministry,
    team: { total: 2, pending: 1, confirmed: 1 },
    my_assignments: [
      { id: "mine", role_id: "role-1", role_name: "Função 1", status: "pending" },
      { id: "second", role_id: "role-2", role_name: "Função 2", status: "confirmed" },
    ],
    can_manage: false,
  }]);
});

for (const [method, table] of [
  ["getManageableScheduleCards", "schedules"],
  ["getUserScheduleCards", "schedule_assignments"],
] as const) {
  test(`${method} preserves errors from the backend`, async () => {
    const { service } = loadCardService(table, null, { message: "Falha de exemplo" });
    assert.deepEqual(await service[method]("user-example"), {
      data: null, error: "Falha de exemplo",
    });
  });

  test(`${method} returns an empty list when the backend has no data`, async () => {
    const { service, filters } = loadCardService(table, null);
    assert.deepEqual(await service[method]("user-example"), { data: [], error: null });
    if (method === "getManageableScheduleCards") assert.deepEqual(filters, []);
  });
}
