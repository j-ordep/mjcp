import test from "node:test";
import assert from "node:assert/strict";
import {
  createQueryBuilder,
  loadServiceModule,
} from "./serviceTestHelpers";

test("manageable ministries require membership leadership rather than a global role", async () => {
  const filters: unknown[][] = [];
  const builder = createQueryBuilder({ select: { data: [
    { is_leader: true, joined_at: "2030-01-01", ministries: { id: "led", name: "Equipe A" } },
    { is_leader: false, joined_at: "2030-01-01", ministries: { id: "served", name: "Equipe B" } },
    { is_leader: true, joined_at: "2030-01-01", ministries: null },
  ] } });
  builder.eq = (...args: unknown[]) => { filters.push(args); return builder; };
  const service = loadServiceModule<typeof import("../src/services/ministryService")>("../src/services/ministryService", {
    from(table: string) { assert.equal(table, "ministry_members"); return builder; },
  });
  const result = await service.getManageableMinistries({ userId: "user-example", isAdmin: false });
  assert.equal(result.error, null);
  assert.deepEqual(result.data?.map((item) => item.id), ["led"]);
  assert.deepEqual(filters, [["user_id", "user-example"]]);
});

test("admins load all manageable ministries but missing identity never queries", async () => {
  let reads = 0;
  const builder = createQueryBuilder({ select: { data: [{ id: "ministry-example", name: "Equipe" }] } });
  const service = loadServiceModule<typeof import("../src/services/ministryService")>("../src/services/ministryService", {
    from(table: string) { reads++; assert.equal(table, "ministries"); return builder; },
  });
  assert.equal((await service.getManageableMinistries({ userId: "", isAdmin: true })).data, null);
  assert.equal(reads, 0);
  assert.deepEqual((await service.getManageableMinistries({ userId: "admin-example", isAdmin: true })).data?.map((item) => item.id), ["ministry-example"]);
  assert.equal(reads, 1);
});

test("getUserMinistries keeps user scoping and object/array relation fallbacks", async () => {
  const filters: unknown[][] = [];
  const builder = createQueryBuilder({ select: { data: [
    {
      is_leader: true, joined_at: "2030-01-01T00:00:00.000Z",
      ministries: [{ id: "ministry-example", name: "Exemplo", description: null, color: null }],
    },
    { is_leader: false, joined_at: "2030-01-02T00:00:00.000Z", ministries: null },
  ] } });
  builder.eq = (...args: unknown[]) => { filters.push(args); return builder; };
  const { getUserMinistries } = loadServiceModule<typeof import("../src/services/ministryService")>(
    "../src/services/ministryService",
    { from(table: string) { assert.equal(table, "ministry_members"); return builder; } },
  );
  assert.deepEqual(await getUserMinistries("user-example"), {
    data: [
      { id: "ministry-example", name: "Exemplo", description: null, color: "#000000", is_leader: true, joined_at: "2030-01-01T00:00:00.000Z" },
      { id: "", name: "Ministério", description: null, color: "#000000", is_leader: false, joined_at: "2030-01-02T00:00:00.000Z" },
    ],
    error: null,
  });
  assert.deepEqual(filters, [["user_id", "user-example"]]);
});

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

test("getMinistryMembersDetailed uses the visible-profile lookup and keeps contact data private", async () => {
  const membershipSelects: string[] = [];
  const profileLookupCalls: string[][] = [];
  const supabaseModulePath = require.resolve("../src/lib/supabase");
  const profileServiceModulePath = require.resolve("../src/services/profileService");
  const ministryServiceModulePath = require.resolve("../src/services/ministryService");

  delete require.cache[ministryServiceModulePath];
  delete require.cache[profileServiceModulePath];
  require.cache[supabaseModulePath] = ({
    id: supabaseModulePath,
    filename: supabaseModulePath,
    loaded: true,
    exports: {
      supabase: {
        from(table: string) {
          assert.equal(table, "ministry_members");
          const builder = createQueryBuilder({
            select: {
              data: [
                {
                  id: "member-1",
                  ministry_id: "ministry-1",
                  user_id: "user-1",
                  is_leader: false,
                  joined_at: "2026-07-01T00:00:00.000Z",
                  ministry_member_roles: [
                    {
                      role_id: "role-1",
                      ministry_roles: { id: "role-1", name: "Voz" },
                    },
                  ],
                },
              ],
              error: null,
            },
          });
          const select = builder.select;
          builder.select = (selection: string) => {
            membershipSelects.push(selection);
            return select(selection);
          };
          return builder;
        },
      },
    },
    children: [],
    paths: [],
  } as unknown) as NodeJS.Module;
  require.cache[profileServiceModulePath] = ({
    id: profileServiceModulePath,
    filename: profileServiceModulePath,
    loaded: true,
    exports: {
      searchProfiles: () => Promise.resolve({ data: [], error: null }),
      getProfilesByIds: (userIds: string[]) => {
        profileLookupCalls.push(userIds);
        return Promise.resolve({
          data: [
            {
              id: "user-1",
              full_name: "Maria Souza",
              email: null,
              avatar_url: "https://example.com/avatar.png",
              role: "member",
            },
          ],
          error: null,
        });
      },
    },
    children: [],
    paths: [],
  } as unknown) as NodeJS.Module;

  const { getMinistryMembersDetailed } = require("../src/services/ministryService") as typeof import("../src/services/ministryService");
  const result = await getMinistryMembersDetailed("ministry-1");

  assert.equal(result.error, null);
  assert.deepEqual(profileLookupCalls, [["user-1"]]);
  assert.doesNotMatch(membershipSelects[0] ?? "", /profiles/i);
  assert.deepEqual(result.data, [
    {
      id: "member-1",
      ministry_id: "ministry-1",
      user_id: "user-1",
      full_name: "Maria Souza",
      email: null,
      avatar_url: "https://example.com/avatar.png",
      is_leader: false,
      joined_at: "2026-07-01T00:00:00.000Z",
      capability_role_ids: ["role-1"],
      capability_roles: [{ id: "role-1", name: "Voz" }],
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
