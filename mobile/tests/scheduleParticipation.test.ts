import test from "node:test";
import assert from "node:assert/strict";
import {
  getParticipationStatusLabel,
  getOwnAssignments,
  getOwnRoleLabel,
  hasConfirmableAssignments,
  type ScheduleParticipationLike,
} from "../src/utils/scheduleParticipation";

const assignments: ScheduleParticipationLike[] = [
  {
    id: "a1",
    user_id: "user-1",
    status: "pending",
    role_name: "Vocal",
  },
  {
    id: "a2",
    user_id: "user-1",
    status: "confirmed",
    role_name: "Violao",
  },
  {
    id: "a3",
    user_id: "user-2",
    status: "confirmed",
    role_name: "Teclado",
  },
];

test("getOwnAssignments returns only the assignments of the current user", () => {
  const result = getOwnAssignments(assignments, "user-1");

  assert.equal(result.length, 2);
  assert.deepEqual(
    result.map((assignment) => assignment.id),
    ["a1", "a2"],
  );
});

test("getOwnAssignments returns an empty list when there is no user id", () => {
  const result = getOwnAssignments(assignments, undefined);

  assert.deepEqual(result, []);
});

test("hasConfirmableAssignments returns true when any assignment is pending", () => {
  const result = hasConfirmableAssignments(getOwnAssignments(assignments, "user-1"));

  assert.equal(result, true);
});

test("hasConfirmableAssignments returns false when all assignments are confirmed", () => {
  const confirmedOnly = getOwnAssignments(assignments, "user-2");

  assert.equal(hasConfirmableAssignments(confirmedOnly), false);
});

test("hasConfirmableAssignments ignores swapped and declined assignments", () => {
  const nonConfirmableAssignments: ScheduleParticipationLike[] = [
    {
      id: "a4",
      user_id: "user-3",
      status: "swapped",
      role_name: "Guitarra",
    },
    {
      id: "a5",
      user_id: "user-3",
      status: "declined",
      role_name: "Back vocal",
    },
  ];

  assert.equal(hasConfirmableAssignments(nonConfirmableAssignments), false);
});

test("getParticipationStatusLabel returns Pendente when there is any pending assignment", () => {
  const result = getParticipationStatusLabel(getOwnAssignments(assignments, "user-1"));

  assert.equal(result, "Pendente");
});

test("getParticipationStatusLabel returns Sem participacao when there are no assignments", () => {
  const result = getParticipationStatusLabel([]);

  assert.equal(result, "Sem participacao");
});

test("getParticipationStatusLabel returns Confirmado when all assignments are confirmed", () => {
  const result = getParticipationStatusLabel([
    {
      id: "a6",
      user_id: "user-4",
      status: "confirmed",
      role_name: "Baixo",
    },
    {
      id: "a7",
      user_id: "user-4",
      status: "confirmed",
      role_name: "Bateria",
    },
  ]);

  assert.equal(result, "Confirmado");
});

test("getParticipationStatusLabel returns Parcialmente confirmado when confirmed is mixed with other statuses", () => {
  const result = getParticipationStatusLabel([
    {
      id: "a8",
      user_id: "user-5",
      status: "confirmed",
      role_name: "Guitarra",
    },
    {
      id: "a9",
      user_id: "user-5",
      status: "declined",
      role_name: "Teclado",
    },
  ]);

  assert.equal(result, "Parcialmente confirmado");
});

test("getParticipationStatusLabel returns Recusado when all assignments are declined", () => {
  const result = getParticipationStatusLabel([
    {
      id: "a10",
      user_id: "user-6",
      status: "declined",
      role_name: "Violino",
    },
  ]);

  assert.equal(result, "Recusado");
});

test("getParticipationStatusLabel returns Trocado when all assignments were swapped", () => {
  const result = getParticipationStatusLabel([
    {
      id: "a6",
      user_id: "user-4",
      status: "swapped",
      role_name: "Baixo",
    },
  ]);

  assert.equal(result, "Trocado");
});

test("getOwnRoleLabel joins role names in display order", () => {
  const result = getOwnRoleLabel(getOwnAssignments(assignments, "user-1"));

  assert.equal(result, "Vocal, Violao");
});

test("getOwnRoleLabel returns an empty string when the user has no assignments", () => {
  const result = getOwnRoleLabel([]);

  assert.equal(result, "");
});
