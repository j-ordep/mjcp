import test from "node:test";
import assert from "node:assert/strict";
import {
  getOwnAssignments,
  getOwnRoleLabel,
  hasPendingAssignments,
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

test("hasPendingAssignments returns true when any assignment is not confirmed", () => {
  const result = hasPendingAssignments(getOwnAssignments(assignments, "user-1"));

  assert.equal(result, true);
});

test("hasPendingAssignments returns false when all assignments are confirmed", () => {
  const confirmedOnly = getOwnAssignments(assignments, "user-2");

  assert.equal(hasPendingAssignments(confirmedOnly), false);
});

test("getOwnRoleLabel joins role names in display order", () => {
  const result = getOwnRoleLabel(getOwnAssignments(assignments, "user-1"));

  assert.equal(result, "Vocal, Violao");
});

test("getOwnRoleLabel returns an empty string when the user has no assignments", () => {
  const result = getOwnRoleLabel([]);

  assert.equal(result, "");
});
