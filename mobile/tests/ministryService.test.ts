import test from "node:test";
import assert from "node:assert/strict";
import {
  createQueryBuilder,
  loadServiceModule,
} from "./serviceTestHelpers";

test("removeUserFromMinistry deletes assignments before removing the member", async () => {
  const callLog: string[] = [];
  const deletedAssignmentIds: string[][] = [];
  const deletedMemberIds: string[] = [];

  const supabaseMock = {
    from(table: string) {
      callLog.push(table);

      if (table === "ministry_members") {
        const builder = createQueryBuilder({
          single: {
            data: {
              id: "member-1",
              ministry_id: "ministry-1",
              user_id: "user-1",
            },
          },
        });

        builder.delete = () => ({
          eq: async (_field: string, value: string) => {
            deletedMemberIds.push(value);
            return { data: null, error: null };
          },
        });

        return builder;
      }

      if (table === "schedule_assignments") {
        const builder = createQueryBuilder({
          select: {
            data: [{ id: "assignment-1" }, { id: "assignment-2" }],
          },
        });

        builder.delete = () => ({
          in: async (_field: string, values: string[]) => {
            deletedAssignmentIds.push(values);
            return { data: null, error: null };
          },
        });

        return builder;
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };

  const { removeUserFromMinistry } = loadServiceModule<{
    removeUserFromMinistry: (
      memberId: string,
    ) => Promise<{ error: string | null }>;
  }>("../src/services/ministryService", supabaseMock);

  const result = await removeUserFromMinistry("member-1");

  assert.equal(result.error, null);
  assert.deepEqual(callLog, [
    "ministry_members",
    "schedule_assignments",
    "schedule_assignments",
    "ministry_members",
  ]);
  assert.deepEqual(deletedAssignmentIds, [["assignment-1", "assignment-2"]]);
  assert.deepEqual(deletedMemberIds, ["member-1"]);
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
