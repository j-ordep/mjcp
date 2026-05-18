import assert from "node:assert/strict";
import test from "node:test";
import { canManageEvents } from "../src/utils/eventPermissions";

test("canManageEvents allows admins even without explicit flag", () => {
  assert.equal(
    canManageEvents({
      role: "admin",
      can_manage_events: false,
    }),
    true,
  );
});

test("canManageEvents allows non-admin users with explicit event permission", () => {
  assert.equal(
    canManageEvents({
      role: "leader",
      can_manage_events: true,
    }),
    true,
  );
});

test("canManageEvents blocks members without explicit event permission", () => {
  assert.equal(
    canManageEvents({
      role: "member",
      can_manage_events: false,
    }),
    false,
  );
});

test("canManageEvents blocks null profiles", () => {
  assert.equal(canManageEvents(null), false);
});
