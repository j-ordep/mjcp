import test from "node:test";
import assert from "node:assert/strict";
import {
  compareScheduleCardsByDate,
  mapManageableScheduleCards,
  mapUserScheduleCards,
} from "../src/utils/scheduleCardMappers";

test("mapManageableScheduleCards builds manageable cards and filters my assignments", () => {
  const result = mapManageableScheduleCards(
    [
      {
        id: "schedule-2",
        created_at: "2026-04-09T00:00:00.000Z",
        events: {
          id: "event-2",
          title: "Culto Noite",
          start_at: "2026-04-10T20:00:00.000Z",
          location: "Templo",
          description: null,
        },
        ministries: {
          id: "ministry-1",
          name: "Louvor",
        },
        schedule_assignments: [
          {
            id: "assignment-1",
            user_id: "user-1",
            role_id: "role-1",
            status: "pending",
            ministry_roles: { name: "Vocal" },
          },
          {
            id: "assignment-2",
            user_id: "user-2",
            role_id: "role-2",
            status: "confirmed",
            ministry_roles: { name: "Violão" },
          },
        ],
      },
      {
        id: "schedule-1",
        created_at: "2026-04-08T00:00:00.000Z",
        events: {
          id: "event-1",
          title: "Ensaio",
          start_at: "2026-04-09T20:00:00.000Z",
          location: "Sala 1",
          description: null,
        },
        ministries: {
          id: "ministry-1",
          name: "Louvor",
        },
        schedule_assignments: null,
      },
    ],
    "user-1",
  );

  assert.equal(result.length, 2);
  assert.equal(result[0].id, "schedule-1");
  assert.deepEqual(result[1].team, {
    total: 2,
    pending: 1,
    confirmed: 1,
  });
  assert.deepEqual(result[1].my_assignments, [
    {
      id: "assignment-1",
      role_id: "role-1",
      role_name: "Vocal",
      status: "pending",
    },
  ]);
  assert.equal(result[1].can_manage, true);
});

test("mapUserScheduleCards groups multiple assignments from the same schedule", () => {
  const result = mapUserScheduleCards([
    {
      id: "assignment-1",
      schedule_id: "schedule-1",
      role_id: "role-1",
      status: "pending",
      ministry_roles: { name: "Vocal" },
      schedules: {
        id: "schedule-1",
        created_at: "2026-04-08T00:00:00.000Z",
        events: {
          id: "event-1",
          title: "Culto",
          start_at: "2026-04-10T18:00:00.000Z",
          location: "Templo",
          description: null,
        },
        ministries: {
          id: "ministry-1",
          name: "Louvor",
        },
        schedule_assignments: [
          { id: "assignment-1", status: "pending" },
          { id: "assignment-2", status: "confirmed" },
        ],
      },
    },
    {
      id: "assignment-2",
      schedule_id: "schedule-1",
      role_id: "role-2",
      status: "confirmed",
      ministry_roles: { name: "Violão" },
      schedules: {
        id: "schedule-1",
        created_at: "2026-04-08T00:00:00.000Z",
        events: {
          id: "event-1",
          title: "Culto",
          start_at: "2026-04-10T18:00:00.000Z",
          location: "Templo",
          description: null,
        },
        ministries: {
          id: "ministry-1",
          name: "Louvor",
        },
        schedule_assignments: [
          { id: "assignment-1", status: "pending" },
          { id: "assignment-2", status: "confirmed" },
        ],
      },
    },
  ]);

  assert.equal(result.length, 1);
  assert.equal(result[0].team.total, 2);
  assert.deepEqual(
    result[0].my_assignments.map((assignment) => assignment.role_name),
    ["Vocal", "Violão"],
  );
  assert.equal(result[0].can_manage, false);
});

test("compareScheduleCardsByDate sorts cards by event start date", () => {
  const result = compareScheduleCardsByDate(
    {
      id: "b",
      created_at: "",
      event: {
        id: "event-b",
        title: "B",
        start_at: "2026-04-11T10:00:00.000Z",
        location: null,
        description: null,
      },
      ministry: { id: "ministry-1", name: "Louvor" },
      team: { total: 0, pending: 0, confirmed: 0 },
      my_assignments: [],
      can_manage: false,
    },
    {
      id: "a",
      created_at: "",
      event: {
        id: "event-a",
        title: "A",
        start_at: "2026-04-10T10:00:00.000Z",
        location: null,
        description: null,
      },
      ministry: { id: "ministry-1", name: "Louvor" },
      team: { total: 0, pending: 0, confirmed: 0 },
      my_assignments: [],
      can_manage: false,
    },
  );

  assert.ok(result > 0);
});
