import test from "node:test";
import assert from "node:assert/strict";
import {
  createQueryBuilder,
  loadServiceModule,
} from "./serviceTestHelpers";

test("removeUserFromMinistry delegates removal and history preservation to the secure rpc", async () => {
  const rpcCalls: Array<{ fn: string; args: Record<string, unknown> }> = [];
  const supabaseMock = {
    from(table: string) {
      throw new Error(`Unexpected direct table access: ${table}`);
    },
    rpc: async (fn: string, args: Record<string, unknown>) => {
      rpcCalls.push({ fn, args });
      return { data: null, error: null };
    },
  };

  const { removeUserFromMinistry } = loadServiceModule<{
    removeUserFromMinistry: (
      memberId: string,
    ) => Promise<{ error: string | null }>;
  }>("../src/services/ministryService", supabaseMock);

  const result = await removeUserFromMinistry("member-1");

  assert.equal(result.error, null);
  assert.deepEqual(rpcCalls, [
    {
      fn: "remove_ministry_member_preserving_history",
      args: { p_member_id: "member-1" },
    },
  ]);
});

test("saveMinistryMemberCapabilities stops after delete when there are no roles", async () => {
  let insertCalled = false;

  const supabaseMock = {
    from(table: string) {
      if (table !== "ministry_member_roles") {
        throw new Error(`Unexpected table: ${table}`);
      }

      const builder = createQueryBuilder();
      builder.delete = () => ({
        eq: async () => ({ data: null, error: null }),
      });
      builder.insert = () => {
        insertCalled = true;
        return Promise.resolve({ data: null, error: null });
      };
      return builder;
    },
  };

  const { saveMinistryMemberCapabilities } = loadServiceModule<{
    saveMinistryMemberCapabilities: (
      memberId: string,
      roleIds: string[],
    ) => Promise<{ error: string | null }>;
  }>("../src/services/ministryService", supabaseMock);

  const result = await saveMinistryMemberCapabilities("member-1", []);

  assert.equal(result.error, null);
  assert.equal(insertCalled, false);
});

test("saveMinistryMemberCapabilities inserts the expected payload", async () => {
  const insertPayloads: Array<
    { member_id: string; role_id: string }[]
  > = [];

  const supabaseMock = {
    from(table: string) {
      if (table !== "ministry_member_roles") {
        throw new Error(`Unexpected table: ${table}`);
      }

      const builder = createQueryBuilder();
      builder.delete = () => ({
        eq: async () => ({ data: null, error: null }),
      });
      builder.insert = (payload: { member_id: string; role_id: string }[]) => {
        insertPayloads.push(payload);
        return Promise.resolve({ data: null, error: null });
      };
      return builder;
    },
  };

  const { saveMinistryMemberCapabilities } = loadServiceModule<{
    saveMinistryMemberCapabilities: (
      memberId: string,
      roleIds: string[],
    ) => Promise<{ error: string | null }>;
  }>("../src/services/ministryService", supabaseMock);

  const result = await saveMinistryMemberCapabilities("member-1", [
    "role-1",
    "role-2",
  ]);

  assert.equal(result.error, null);
  assert.deepEqual(insertPayloads, [
    [
      { member_id: "member-1", role_id: "role-1" },
      { member_id: "member-1", role_id: "role-2" },
    ],
  ]);
});

test("searchRegisteredUsers keeps admin hidden in ministry search", async () => {
  const supabaseModulePath = require.resolve("../src/lib/supabase");
  const profileServiceModulePath = require.resolve("../src/services/profileService");
  const ministryServiceModulePath = require.resolve("../src/services/ministryService");
  const searchCalls: unknown[][] = [];

  delete require.cache[ministryServiceModulePath];
  delete require.cache[profileServiceModulePath];
  require.cache[supabaseModulePath] = ({
    id: supabaseModulePath,
    filename: supabaseModulePath,
    loaded: true,
    exports: { supabase: {} },
    children: [],
    paths: [],
  } as unknown) as NodeJS.Module;
  require.cache[profileServiceModulePath] = ({
    id: profileServiceModulePath,
    filename: profileServiceModulePath,
    loaded: true,
    exports: {
      searchProfiles: (...args: unknown[]) => {
        searchCalls.push(args);
        return Promise.resolve({ data: [], error: null });
      },
    },
    children: [],
    paths: [],
  } as unknown) as NodeJS.Module;

  const { searchRegisteredUsers } = require("../src/services/ministryService") as typeof import("../src/services/ministryService");
  const result = await searchRegisteredUsers("Ana");

  assert.equal(result.error, null);
  assert.deepEqual(searchCalls[0], ["Ana", { excludeRoles: ["admin"] }]);
});
