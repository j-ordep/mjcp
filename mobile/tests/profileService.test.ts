import test from "node:test";
import assert from "node:assert/strict";
import { loadServiceModule } from "./serviceTestHelpers";

type ProfileService = typeof import("../src/services/profileService");

function createProfilesQueryMock(response: {
  data?: unknown[];
  error?: { message: string } | null;
}) {
  const calls = {
    from: [] as string[],
    select: [] as unknown[][],
    eq: [] as unknown[][],
    neq: [] as unknown[][],
    order: [] as unknown[][],
    range: [] as unknown[][],
    or: [] as unknown[][],
  };

  const builder: any = {
    select: (...args: unknown[]) => {
      calls.select.push(args);
      return builder;
    },
    eq: (...args: unknown[]) => {
      calls.eq.push(args);
      return builder;
    },
    neq: (...args: unknown[]) => {
      calls.neq.push(args);
      return builder;
    },
    order: (...args: unknown[]) => {
      calls.order.push(args);
      return builder;
    },
    range: (...args: unknown[]) => {
      calls.range.push(args);
      return builder;
    },
    or: (...args: unknown[]) => {
      calls.or.push(args);
      return builder;
    },
    single: async () => ({
      data: (response.data?.[0] ?? null),
      error: response.error ?? null,
    }),
    then: (
      onfulfilled: (value: {
        data: unknown[];
        error: { message: string } | null;
      }) => unknown,
      onrejected?: (reason: unknown) => unknown,
    ) =>
      Promise.resolve({
        data: response.data ?? [],
        error: response.error ?? null,
      }).then(onfulfilled, onrejected),
  };

  return {
    calls,
    supabaseMock: {
      from: (table: string) => {
        calls.from.push(table);
        return builder;
      },
    },
  };
}

function createProfilePermissionRpcMock(response: {
  data?: unknown;
  error?: { message: string } | null;
}) {
  const calls = {
    rpc: [] as Array<{ fn: string; args: Record<string, unknown> }>,
  };

  return {
    calls,
    supabaseMock: {
      rpc: async (fn: string, args: Record<string, unknown>) => {
        calls.rpc.push({ fn, args });
        return {
          data: response.data ?? null,
          error: response.error ?? null,
        };
      },
    },
  };
}

function createProfilesRpcMock(response: {
  data?: unknown[];
  error?: { message: string } | null;
}) {
  const calls = {
    from: [] as string[],
    rpc: [] as Array<{ fn: string; args: Record<string, unknown> }>,
  };

  return {
    calls,
    supabaseMock: {
      from: (table: string) => {
        calls.from.push(table);
        throw new Error(`Unexpected direct table access: ${table}`);
      },
      rpc: async (fn: string, args: Record<string, unknown>) => {
        calls.rpc.push({ fn, args });
        return {
          data: response.data ?? [],
          error: response.error ?? null,
        };
      },
    },
  };
}

test("listProfilesPage loads the first page with 10 members and reports hasMore", async () => {
  const { calls, supabaseMock } = createProfilesRpcMock({
    data: Array.from({ length: 11 }, (_, index) => ({
      id: `user-${index + 1}`,
      full_name: `Membro ${index + 1}`,
      avatar_url: null,
      role: "member",
    })),
  });

  const { listProfilesPage } = loadServiceModule<ProfileService>(
    "../src/services/profileService",
    supabaseMock,
  );

  const result = await listProfilesPage({ page: 0, pageSize: 10 });

  assert.equal(result.error, null);
  assert.equal(result.hasMore, true);
  assert.equal(result.data?.length, 10);
  assert.deepEqual(calls.from, []);
  assert.deepEqual(calls.rpc[0], {
    fn: "search_visible_profiles",
    args: {
      p_query: "",
      p_limit: 11,
      p_offset: 0,
      p_excluded_roles: [],
    },
  });
  assert.equal(result.data?.[0]?.email, null);
});

test("listProfilesPage can exclude admin profiles when requested", async () => {
  const { calls, supabaseMock } = createProfilesRpcMock({
    data: [],
  });

  const { listProfilesPage } = loadServiceModule<ProfileService>(
    "../src/services/profileService",
    supabaseMock,
  );

  const result = await listProfilesPage({
    page: 0,
    pageSize: 10,
    excludeRoles: ["admin"],
  });

  assert.equal(result.error, null);
  assert.deepEqual(calls.rpc[0], {
    fn: "search_visible_profiles",
    args: {
      p_query: "",
      p_limit: 11,
      p_offset: 0,
      p_excluded_roles: ["admin"],
    },
  });
});

test("searchProfiles keeps admin profiles available for event audiences", async () => {
  const { calls, supabaseMock } = createProfilesRpcMock({
    data: [
      {
        id: "admin-1",
        full_name: "Pastora Ana",
        avatar_url: null,
        role: "admin",
      },
    ],
  });

  const { searchProfiles } = loadServiceModule<ProfileService>(
    "../src/services/profileService",
    supabaseMock,
  );

  const result = await searchProfiles("Ana");

  assert.equal(result.error, null);
  assert.equal(result.data?.[0]?.role, "admin");
  assert.equal(result.data?.[0]?.email, null);
  assert.deepEqual(calls.rpc[0], {
    fn: "search_visible_profiles",
    args: {
      p_query: "Ana",
      p_limit: 31,
      p_offset: 0,
      p_excluded_roles: [],
    },
  });
});

test("listProfilesPage applies name search and advances pagination", async () => {
  const { calls, supabaseMock } = createProfilesRpcMock({
    data: [
      {
        id: "user-11",
        full_name: "Maria Souza",
        avatar_url: null,
        role: "leader",
      },
    ],
  });

  const { listProfilesPage } = loadServiceModule<ProfileService>(
    "../src/services/profileService",
    supabaseMock,
  );

  const result = await listProfilesPage({
    query: "Maria",
    page: 1,
    pageSize: 10,
  });

  assert.equal(result.error, null);
  assert.equal(result.hasMore, false);
  assert.equal(result.data?.[0]?.full_name, "Maria Souza");
  assert.equal(result.data?.[0]?.email, null);
  assert.deepEqual(calls.rpc[0], {
    fn: "search_visible_profiles",
    args: {
      p_query: "Maria",
      p_limit: 11,
      p_offset: 10,
      p_excluded_roles: [],
    },
  });
});

test("getProfile normalizes missing can_manage_events to false", async () => {
  const { supabaseMock } = createProfilesQueryMock({
    data: [
      {
        id: "user-1",
        full_name: "Rute",
        email: "rute@example.com",
        phone: null,
        avatar_url: null,
        role: "leader",
        created_at: "2026-05-09T00:00:00.000Z",
      },
    ],
  });

  const { getProfile } = loadServiceModule<ProfileService>(
    "../src/services/profileService",
    supabaseMock,
  );

  const result = await getProfile("user-1");

  assert.equal(result.error, null);
  assert.equal(result.profile?.can_manage_events, false);
});

test("getProfile hides technical backend errors behind a friendly fallback", async () => {
  const { supabaseMock } = createProfilesQueryMock({
    error: {
      message: 'new row violates row-level security policy for table "profiles"',
    },
  });

  const { getProfile } = loadServiceModule<ProfileService>(
    "../src/services/profileService",
    supabaseMock,
  );

  const result = await getProfile("user-1");

  assert.equal(
    result.error,
    "Nao foi possivel carregar seu perfil. Tente novamente em alguns instantes.",
  );
});

test("listProfilesForEventPermissionPage returns current event permission flags", async () => {
  const { calls, supabaseMock } = createProfilesRpcMock({
    data: [
      {
        id: "user-1",
        full_name: "Lia",
        email: "lia@example.com",
        avatar_url: null,
        role: "leader",
        can_manage_events: true,
      },
      {
        id: "user-2",
        full_name: "Marta",
        email: "marta@example.com",
        avatar_url: null,
        role: "member",
      },
    ],
  });

  const profileService = loadServiceModule<Record<string, any>>(
    "../src/services/profileService",
    supabaseMock,
  );

  const result = await profileService.listProfilesForEventPermissionPage({
    page: 0,
    pageSize: 10,
  });

  assert.equal(result.error, null);
  assert.deepEqual(calls.from, []);
  assert.deepEqual(calls.rpc[0], {
    fn: "list_profiles_for_event_permissions",
    args: {
      p_query: "",
      p_limit: 11,
      p_offset: 0,
      p_excluded_roles: [],
    },
  });
  assert.deepEqual(result.data, [
    {
      id: "user-1",
      full_name: "Lia",
      email: "lia@example.com",
      avatar_url: null,
      role: "leader",
      can_manage_events: true,
    },
    {
      id: "user-2",
      full_name: "Marta",
      email: "marta@example.com",
      avatar_url: null,
      role: "member",
      can_manage_events: false,
    },
  ]);
});

test("getProfilesByIds uses the visible-profile lookup without exposing email", async () => {
  const { calls, supabaseMock } = createProfilesRpcMock({
    data: [
      {
        id: "user-2",
        full_name: "Marta",
        avatar_url: null,
        role: "member",
      },
      {
        id: "user-1",
        full_name: "Lia",
        avatar_url: null,
        role: "leader",
      },
    ],
  });

  const { getProfilesByIds } = loadServiceModule<ProfileService>(
    "../src/services/profileService",
    supabaseMock,
  );

  const result = await getProfilesByIds(["user-1", "user-2"]);

  assert.equal(result.error, null);
  assert.deepEqual(calls.from, []);
  assert.deepEqual(calls.rpc[0], {
    fn: "get_visible_profiles_by_ids",
    args: {
      p_user_ids: ["user-1", "user-2"],
    },
  });
  assert.deepEqual(result.data, [
    {
      id: "user-1",
      full_name: "Lia",
      email: null,
      avatar_url: null,
      role: "leader",
    },
    {
      id: "user-2",
      full_name: "Marta",
      email: null,
      avatar_url: null,
      role: "member",
    },
  ]);
});

test("setProfileEventManagementPermission calls the secure rpc", async () => {
  const { calls, supabaseMock } = createProfilePermissionRpcMock({
    data: {
      id: "user-2",
      full_name: "Marta",
      email: "marta@example.com",
      avatar_url: null,
      role: "member",
      can_manage_events: true,
    },
  });

  const profileService = loadServiceModule<Record<string, any>>(
    "../src/services/profileService",
    supabaseMock,
  );

  const result = await profileService.setProfileEventManagementPermission(
    "user-2",
    true,
  );

  assert.equal(result.error, null);
  assert.deepEqual(calls.rpc[0], {
    fn: "set_profile_event_management_permission",
    args: {
      p_user_id: "user-2",
      p_can_manage_events: true,
    },
  });
  assert.deepEqual(result.data, {
    id: "user-2",
    full_name: "Marta",
    email: "marta@example.com",
    avatar_url: null,
    role: "member",
    can_manage_events: true,
  });
});

test("setProfileEventManagementPermission returns the rpc error message", async () => {
  const { supabaseMock } = createProfilePermissionRpcMock({
    error: {
      message: "Apenas administradores podem alterar esta permissao.",
    },
  });

  const profileService = loadServiceModule<Record<string, any>>(
    "../src/services/profileService",
    supabaseMock,
  );

  const result = await profileService.setProfileEventManagementPermission(
    "user-2",
    false,
  );

  assert.equal(result.data, null);
  assert.equal(
    result.error,
    "Apenas administradores podem alterar esta permissao.",
  );
});
