import test from "node:test";
import assert from "node:assert/strict";
import {
  extractAssignmentIds,
  firstRelation,
  mapMinistryMemberWithCapabilities,
  mapSearchableUsers,
  mapUserMinistries,
} from "../src/utils/ministryMappers";

test("firstRelation returns the first item when the relation comes as an array", () => {
  const result = firstRelation([{ id: "a" }, { id: "b" }]);

  assert.deepEqual(result, { id: "a" });
});

test("mapMinistryMemberWithCapabilities keeps member data and flattens capability roles", () => {
  const result = mapMinistryMemberWithCapabilities({
    id: "member-1",
    ministry_id: "ministry-1",
    user_id: "user-1",
    is_leader: true,
    joined_at: "2026-04-09T00:00:00.000Z",
    profiles: {
      full_name: "João",
      email: "joao@example.com",
      avatar_url: "avatar.png",
    },
    ministry_member_roles: [
      {
        role_id: "role-1",
        ministry_roles: { id: "role-1", name: "Vocal" },
      },
      {
        role_id: "role-2",
        ministry_roles: { id: "role-2", name: "Violão" },
      },
    ],
  });

  assert.deepEqual(result.capability_role_ids, ["role-1", "role-2"]);
  assert.deepEqual(result.capability_roles, [
    { id: "role-1", name: "Vocal" },
    { id: "role-2", name: "Violão" },
  ]);
  assert.equal(result.full_name, "João");
  assert.equal(result.is_leader, true);
});

test("mapMinistryMemberWithCapabilities uses safe defaults when profile data is missing", () => {
  const result = mapMinistryMemberWithCapabilities({
    id: "member-2",
    ministry_id: "ministry-1",
    user_id: "user-2",
    is_leader: false,
    joined_at: "2026-04-09T00:00:00.000Z",
    profiles: null,
    ministry_member_roles: null,
  });

  assert.equal(result.full_name, "Membro");
  assert.equal(result.email, null);
  assert.deepEqual(result.capability_role_ids, []);
});

test("mapUserMinistries normalizes missing color and ministry values", () => {
  const result = mapUserMinistries([
    {
      is_leader: true,
      joined_at: "2026-04-09T00:00:00.000Z",
      ministries: {
        id: "ministry-1",
        name: "Louvor",
        description: "Ministério de música",
        color: null,
      },
    },
    {
      is_leader: false,
      joined_at: "2026-04-10T00:00:00.000Z",
      ministries: null,
    },
  ]);

  assert.equal(result[0].color, "#000000");
  assert.equal(result[1].name, "Ministério");
});

test("mapSearchableUsers fills missing display name", () => {
  const result = mapSearchableUsers([
    {
      id: "user-1",
      full_name: null,
      email: "user@example.com",
      avatar_url: null,
      role: "member",
    },
  ]);

  assert.equal(result[0].full_name, "Usuário");
});

test("extractAssignmentIds returns only the id list in order", () => {
  const result = extractAssignmentIds([
    { id: "a1" },
    { id: "a2" },
  ]);

  assert.deepEqual(result, ["a1", "a2"]);
});
