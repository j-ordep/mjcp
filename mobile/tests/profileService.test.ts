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

test("listProfilesPage loads the first page with 10 members and reports hasMore", async () => {
  const { calls, supabaseMock } = createProfilesQueryMock({
    data: Array.from({ length: 11 }, (_, index) => ({
      id: `user-${index + 1}`,
      full_name: `Membro ${index + 1}`,
      email: `membro${index + 1}@example.com`,
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
  assert.equal(calls.from[0], "profiles");
  assert.deepEqual(calls.neq, []);
  assert.deepEqual(calls.range[0], [0, 10]);
  assert.deepEqual(calls.or, []);
});

test("listProfilesPage can exclude admin profiles when requested", async () => {
  const { calls, supabaseMock } = createProfilesQueryMock({
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
  assert.deepEqual(calls.neq[0], ["role", "admin"]);
});

test("searchProfiles keeps admin profiles available for event audiences", async () => {
  const { calls, supabaseMock } = createProfilesQueryMock({
    data: [
      {
        id: "admin-1",
        full_name: "Pastora Ana",
        email: "ana@example.com",
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
  assert.deepEqual(calls.neq, []);
  assert.deepEqual(calls.range[0], [0, 30]);
  assert.deepEqual(calls.or[0], [
    "full_name.ilike.%Ana%,email.ilike.%Ana%",
  ]);
});

test("listProfilesPage applies name search and advances pagination", async () => {
  const { calls, supabaseMock } = createProfilesQueryMock({
    data: [
      {
        id: "user-11",
        full_name: "Maria Souza",
        email: "maria@example.com",
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
  assert.deepEqual(calls.range[0], [10, 20]);
  assert.deepEqual(calls.or[0], [
    "full_name.ilike.%Maria%,email.ilike.%Maria%",
  ]);
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
  const { calls, supabaseMock } = createProfilesQueryMock({
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
  assert.deepEqual(calls.select[0], [
    "id,full_name,email,avatar_url,role,can_manage_events",
  ]);
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
