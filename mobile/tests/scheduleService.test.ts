import test from "node:test";
import assert from "node:assert/strict";
import {
  createQueryBuilder,
  loadServiceModule,
} from "./serviceTestHelpers";

function loadScheduleServiceWithProfileLookup(
  supabaseMock: unknown,
  getProfilesByIds: (userIds: string[]) => Promise<{
    data: Array<{
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    }> | null;
    error: string | null;
  }>,
) {
  const supabaseModulePath = require.resolve("../src/lib/supabase");
  const profileServiceModulePath = require.resolve("../src/services/profileService");
  const scheduleServiceModulePath = require.resolve("../src/services/scheduleService");

  delete require.cache[scheduleServiceModulePath];
  delete require.cache[profileServiceModulePath];
  require.cache[supabaseModulePath] = ({
    id: supabaseModulePath,
    filename: supabaseModulePath,
    loaded: true,
    exports: { supabase: supabaseMock },
    children: [],
    paths: [],
  } as unknown) as NodeJS.Module;
  require.cache[profileServiceModulePath] = ({
    id: profileServiceModulePath,
    filename: profileServiceModulePath,
    loaded: true,
    exports: { getProfilesByIds },
    children: [],
    paths: [],
  } as unknown) as NodeJS.Module;

  return require("../src/services/scheduleService") as typeof import("../src/services/scheduleService");
}

test("createScheduleValidated allows creation before event time on the same day", async () => {
  const upsertCalls: unknown[] = [];
  const supabaseMock = {
    from(table: string) {
      if (table === "events") {
        return createQueryBuilder({
          single: {
            data: {
              start_at: "2026-04-10T18:00:00.000Z",
            },
          },
        });
      }

      if (table === "schedules") {
        const builder = createQueryBuilder({
          single: {
            data: {
              id: "schedule-1",
              event_id: "event-1",
              ministry_id: "ministry-1",
            },
          },
        });
        const originalUpsert = builder.upsert;
        builder.upsert = (...args: unknown[]) => {
          upsertCalls.push(args);
          return originalUpsert(...args);
        };
        return builder;
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };

  const realDate = Date;
  global.Date = class extends Date {
    constructor(value?: string | number | Date) {
      super(value ?? "2026-04-10T09:00:00.000Z");
    }

    static now() {
      return new realDate("2026-04-10T09:00:00.000Z").getTime();
    }
  } as DateConstructor;

  const { createScheduleValidated } = loadServiceModule<{
    createScheduleValidated: (input: {
      eventId: string;
      ministryId: string;
    }) => Promise<{ data: { id: string } | null; error: string | null }>;
  }>("../src/services/scheduleService", supabaseMock);

  const result = await createScheduleValidated({
    eventId: "event-1",
    ministryId: "ministry-1",
  });

  global.Date = realDate;

  assert.equal(result.error, null);
  assert.equal(result.data?.id, "schedule-1");
  assert.equal(upsertCalls.length, 1);
});

test("createScheduleValidated blocks creation at the exact event time", async () => {
  const fromCalls: string[] = [];
  const supabaseMock = {
    from(table: string) {
      fromCalls.push(table);

      if (table === "events") {
        return createQueryBuilder({
          single: {
            data: {
              start_at: "2026-04-10T18:00:00.000Z",
            },
          },
        });
      }

      if (table === "schedules") {
        return createQueryBuilder();
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };

  const realDate = Date;
  global.Date = class extends Date {
    constructor(value?: string | number | Date) {
      super(value ?? "2026-04-10T18:00:00.000Z");
    }

    static now() {
      return new realDate("2026-04-10T18:00:00.000Z").getTime();
    }
  } as DateConstructor;

  const { createScheduleValidated } = loadServiceModule<{
    createScheduleValidated: (input: {
      eventId: string;
      ministryId: string;
    }) => Promise<{ data: unknown; error: string | null }>;
  }>("../src/services/scheduleService", supabaseMock);

  const result = await createScheduleValidated({
    eventId: "event-1",
    ministryId: "ministry-1",
  });

  global.Date = realDate;

  assert.equal(result.data, null);
  assert.equal(
    result.error,
    "Evento/escala nao e mais editavel no horario do evento ou depois dele.",
  );
  assert.deepEqual(fromCalls, ["events"]);
});

test("createScheduleValidated upserts schedule when the event is still editable", async () => {
  const upsertCalls: unknown[] = [];
  const selectCalls: number[] = [];
  const supabaseMock = {
    from(table: string) {
      if (table === "events") {
        return createQueryBuilder({
          single: {
            data: {
              start_at: "2026-04-11T18:00:00.000Z",
            },
          },
        });
      }

      if (table === "schedules") {
        const builder = createQueryBuilder({
          single: {
            data: {
              id: "schedule-1",
              event_id: "event-1",
              ministry_id: "ministry-1",
            },
          },
        });
        const originalUpsert = builder.upsert;
        const originalSelect = builder.select;

        builder.upsert = (...args: unknown[]) => {
          upsertCalls.push(args);
          return originalUpsert(...args);
        };
        builder.select = (...args: unknown[]) => {
          selectCalls.push(args.length);
          return originalSelect(...args);
        };

        return builder;
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };

  const realDate = Date;
  global.Date = class extends Date {
    constructor(value?: string | number | Date) {
      super(value ?? "2026-04-10T18:00:00.000Z");
    }

    static now() {
      return new realDate("2026-04-10T18:00:00.000Z").getTime();
    }
  } as DateConstructor;

  const { createScheduleValidated } = loadServiceModule<{
    createScheduleValidated: (input: {
      eventId: string;
      ministryId: string;
    }) => Promise<{ data: { id: string } | null; error: string | null }>;
  }>("../src/services/scheduleService", supabaseMock);

  const result = await createScheduleValidated({
    eventId: "event-1",
    ministryId: "ministry-1",
  });

  global.Date = realDate;

  assert.equal(result.error, null);
  assert.equal(result.data?.id, "schedule-1");
  assert.deepEqual(upsertCalls, [
    [
      [
        {
          event_id: "event-1",
          ministry_id: "ministry-1",
        },
      ],
      { onConflict: "event_id,ministry_id" },
    ],
  ]);
  assert.deepEqual(selectCalls, [0]);
});

test("removeScheduleAssignment allows removal before event time on the same day", async () => {
  const deleteCalls: unknown[] = [];
  const supabaseMock = {
    from(table: string) {
      if (table === "schedule_assignments") {
        const builder = createQueryBuilder({
          single: {
            data: {
              id: "assignment-1",
              schedules: {
                id: "schedule-1",
                ministry_id: "ministry-1",
                events: {
                  id: "event-1",
                  start_at: "2026-04-10T18:00:00.000Z",
                  end_at: null,
                },
              },
            },
          },
        });
        const originalDelete = builder.delete;
        builder.delete = (...args: unknown[]) => {
          deleteCalls.push(args);
          return originalDelete(...args);
        };

        return builder;
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };

  const realDate = Date;
  global.Date = class extends Date {
    constructor(value?: string | number | Date) {
      super(value ?? "2026-04-10T09:00:00.000Z");
    }

    static now() {
      return new realDate("2026-04-10T09:00:00.000Z").getTime();
    }
  } as DateConstructor;

  const { removeScheduleAssignment } = loadServiceModule<{
    removeScheduleAssignment: (
      assignmentId: string,
    ) => Promise<{ error: string | null }>;
  }>("../src/services/scheduleService", supabaseMock);

  const result = await removeScheduleAssignment("assignment-1");

  global.Date = realDate;

  assert.equal(result.error, null);
  assert.equal(deleteCalls.length, 1);
});

test("removeScheduleAssignment blocks removal at the exact event time", async () => {
  const deleteCalls: number[] = [];
  const supabaseMock = {
    from(table: string) {
      if (table === "schedule_assignments") {
        const builder = createQueryBuilder({
          single: {
            data: {
              id: "assignment-1",
              schedules: {
                id: "schedule-1",
                ministry_id: "ministry-1",
                events: {
                  id: "event-1",
                  start_at: "2026-04-10T18:00:00.000Z",
                  end_at: null,
                },
              },
            },
          },
        });
        const originalDelete = builder.delete;
        builder.delete = (...args: unknown[]) => {
          deleteCalls.push(args.length);
          return originalDelete(...args);
        };

        return builder;
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };

  const realDate = Date;
  global.Date = class extends Date {
    constructor(value?: string | number | Date) {
      super(value ?? "2026-04-10T18:00:00.000Z");
    }

    static now() {
      return new realDate("2026-04-10T18:00:00.000Z").getTime();
    }
  } as DateConstructor;

  const { removeScheduleAssignment } = loadServiceModule<{
    removeScheduleAssignment: (
      assignmentId: string,
    ) => Promise<{ error: string | null }>;
  }>("../src/services/scheduleService", supabaseMock);

  const result = await removeScheduleAssignment("assignment-1");

  global.Date = realDate;

  assert.equal(
    result.error,
    "Nao e mais possivel alterar a equipe no horario do evento ou depois dele.",
  );
  assert.deepEqual(deleteCalls, []);
});

test("deleteSchedule allows deletion before event time on the same day", async () => {
  const deleteCalls: unknown[] = [];
  const supabaseMock = {
    from(table: string) {
      if (table === "schedules") {
        const builder = createQueryBuilder({
          single: {
            data: {
              id: "schedule-1",
              ministry_id: "ministry-1",
              events: {
                id: "event-1",
                start_at: "2026-04-10T18:00:00.000Z",
                end_at: null,
              },
            },
          },
        });
        const originalDelete = builder.delete;
        builder.delete = (...args: unknown[]) => {
          deleteCalls.push(args);
          return originalDelete(...args);
        };
        return builder;
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };

  const realDate = Date;
  global.Date = class extends Date {
    constructor(value?: string | number | Date) {
      super(value ?? "2026-04-10T09:00:00.000Z");
    }

    static now() {
      return new realDate("2026-04-10T09:00:00.000Z").getTime();
    }
  } as DateConstructor;

  const { deleteSchedule } = loadServiceModule<{
    deleteSchedule: (scheduleId: string) => Promise<{ error: string | null }>;
  }>("../src/services/scheduleService", supabaseMock);

  const result = await deleteSchedule("schedule-1");

  global.Date = realDate;

  assert.equal(result.error, null);
  assert.equal(deleteCalls.length, 1);
});

test("deleteSchedule blocks deletion at the exact event time", async () => {
  const deleteCalls: unknown[] = [];
  const supabaseMock = {
    from(table: string) {
      if (table === "schedules") {
        const builder = createQueryBuilder({
          single: {
            data: {
              id: "schedule-1",
              ministry_id: "ministry-1",
              events: {
                id: "event-1",
                start_at: "2026-04-10T18:00:00.000Z",
                end_at: null,
              },
            },
          },
        });
        const originalDelete = builder.delete;
        builder.delete = (...args: unknown[]) => {
          deleteCalls.push(args);
          return originalDelete(...args);
        };
        return builder;
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };

  const realDate = Date;
  global.Date = class extends Date {
    constructor(value?: string | number | Date) {
      super(value ?? "2026-04-10T18:00:00.000Z");
    }

    static now() {
      return new realDate("2026-04-10T18:00:00.000Z").getTime();
    }
  } as DateConstructor;

  const { deleteSchedule } = loadServiceModule<{
    deleteSchedule: (scheduleId: string) => Promise<{ error: string | null }>;
  }>("../src/services/scheduleService", supabaseMock);

  const result = await deleteSchedule("schedule-1");

  global.Date = realDate;

  assert.equal(
    result.error,
    "Evento/escala nao e mais editavel no horario do evento ou depois dele.",
  );
  assert.deepEqual(deleteCalls, []);
});

test("confirmMyAssignmentsForSchedule blocks confirmation at the exact event time", async () => {
  const updateCalls: unknown[] = [];
  const supabaseMock = {
    from(table: string) {
      if (table === "schedules") {
        return createQueryBuilder({
          single: {
            data: {
              id: "schedule-1",
              ministry_id: "ministry-1",
              events: {
                id: "event-1",
                start_at: "2026-04-10T18:00:00.000Z",
                end_at: null,
              },
            },
          },
        });
      }

      if (table === "schedule_assignments") {
        const builder = createQueryBuilder();
        const originalUpdate = builder.update;
        builder.update = (...args: unknown[]) => {
          updateCalls.push(args);
          return originalUpdate(...args);
        };
        return builder;
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };

  const realDate = Date;
  global.Date = class extends Date {
    constructor(value?: string | number | Date) {
      super(value ?? "2026-04-10T18:00:00.000Z");
    }

    static now() {
      return new realDate("2026-04-10T18:00:00.000Z").getTime();
    }
  } as DateConstructor;

  const { confirmMyAssignmentsForSchedule } = loadServiceModule<{
    confirmMyAssignmentsForSchedule: (input: {
      scheduleId: string;
      userId: string;
    }) => Promise<{ error: string | null }>;
  }>("../src/services/scheduleService", supabaseMock);

  const result = await confirmMyAssignmentsForSchedule({
    scheduleId: "schedule-1",
    userId: "user-1",
  });

  global.Date = realDate;

  assert.equal(
    result.error,
    "A escala nao permite confirmar presenca no horario do evento ou depois dele.",
  );
  assert.deepEqual(updateCalls, []);
});

test("validateScheduleAssignmentIntegrity rejects roles from another ministry", async () => {
  const realDate = Date;
  global.Date = class extends Date {
    constructor(value?: string | number | Date) {
      super(value ?? "2026-04-10T09:00:00.000Z");
    }

    static now() {
      return new realDate("2026-04-10T09:00:00.000Z").getTime();
    }
  } as DateConstructor;

  const supabaseMock = {
    from(table: string) {
      if (table === "schedules") {
        return createQueryBuilder({
          single: {
            data: {
              id: "schedule-1",
              ministry_id: "ministry-1",
              events: {
                id: "event-1",
                start_at: "2026-04-11T18:00:00.000Z",
                end_at: null,
              },
            },
          },
        });
      }

      if (table === "ministry_roles") {
        return createQueryBuilder({
          single: {
            data: {
              id: "role-1",
              ministry_id: "ministry-2",
            },
          },
        });
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };

  const { validateScheduleAssignmentIntegrity } = loadServiceModule<{
    validateScheduleAssignmentIntegrity: (
      scheduleId: string,
      userId: string,
      roleId: string,
    ) => Promise<{
      isValid: boolean;
      isRoleFromScheduleMinistry: boolean;
      error: string | null;
    }>;
  }>("../src/services/scheduleService", supabaseMock);

  const result = await validateScheduleAssignmentIntegrity(
    "schedule-1",
    "user-1",
    "role-1",
  );

  global.Date = realDate;

  assert.equal(result.isValid, false);
  assert.equal(result.isRoleFromScheduleMinistry, false);
  assert.equal(
    result.error,
    "A funcao selecionada nao pertence ao ministerio da escala.",
  );
});

test("validateScheduleAssignmentIntegrity rejects users outside the schedule ministry", async () => {
  const realDate = Date;
  global.Date = class extends Date {
    constructor(value?: string | number | Date) {
      super(value ?? "2026-04-10T09:00:00.000Z");
    }

    static now() {
      return new realDate("2026-04-10T09:00:00.000Z").getTime();
    }
  } as DateConstructor;

  const supabaseMock = {
    from(table: string) {
      if (table === "schedules") {
        return createQueryBuilder({
          single: {
            data: {
              id: "schedule-1",
              ministry_id: "ministry-1",
              events: {
                id: "event-1",
                start_at: "2026-04-11T18:00:00.000Z",
                end_at: null,
              },
            },
          },
        });
      }

      if (table === "ministry_roles") {
        return createQueryBuilder({
          single: {
            data: {
              id: "role-1",
              ministry_id: "ministry-1",
            },
          },
        });
      }

      if (table === "ministry_members") {
        return createQueryBuilder({
          maybeSingle: {
            data: null,
          },
        });
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };

  const { validateScheduleAssignmentIntegrity } = loadServiceModule<{
    validateScheduleAssignmentIntegrity: (
      scheduleId: string,
      userId: string,
      roleId: string,
    ) => Promise<{
      isValid: boolean;
      isUserMemberOfScheduleMinistry: boolean;
      error: string | null;
    }>;
  }>("../src/services/scheduleService", supabaseMock);

  const result = await validateScheduleAssignmentIntegrity(
    "schedule-1",
    "user-1",
    "role-1",
  );

  global.Date = realDate;

  assert.equal(result.isValid, false);
  assert.equal(result.isUserMemberOfScheduleMinistry, false);
  assert.equal(result.error, "O usuario nao pertence ao ministerio da escala.");
});

test("validateScheduleAssignmentIntegrity rejects users without the selected capability", async () => {
  const realDate = Date;
  global.Date = class extends Date {
    constructor(value?: string | number | Date) {
      super(value ?? "2026-04-10T09:00:00.000Z");
    }

    static now() {
      return new realDate("2026-04-10T09:00:00.000Z").getTime();
    }
  } as DateConstructor;

  const supabaseMock = {
    from(table: string) {
      if (table === "schedules") {
        return createQueryBuilder({
          single: {
            data: {
              id: "schedule-1",
              ministry_id: "ministry-1",
              events: {
                id: "event-1",
                start_at: "2026-04-11T18:00:00.000Z",
                end_at: null,
              },
            },
          },
        });
      }

      if (table === "ministry_roles") {
        return createQueryBuilder({
          single: {
            data: {
              id: "role-1",
              ministry_id: "ministry-1",
            },
          },
        });
      }

      if (table === "ministry_members") {
        return createQueryBuilder({
          maybeSingle: {
            data: { id: "member-1" },
          },
        });
      }

      if (table === "ministry_member_roles") {
        return createQueryBuilder({
          maybeSingle: {
            data: null,
          },
        });
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };

  const { validateScheduleAssignmentIntegrity } = loadServiceModule<{
    validateScheduleAssignmentIntegrity: (
      scheduleId: string,
      userId: string,
      roleId: string,
    ) => Promise<{
      isValid: boolean;
      doesUserHaveCapability: boolean;
      error: string | null;
    }>;
  }>("../src/services/scheduleService", supabaseMock);

  const result = await validateScheduleAssignmentIntegrity(
    "schedule-1",
    "user-1",
    "role-1",
  );

  global.Date = realDate;

  assert.equal(result.isValid, false);
  assert.equal(result.doesUserHaveCapability, false);
  assert.equal(
    result.error,
    "O usuario nao possui capability para a funcao selecionada.",
  );
});

test("validateScheduleAssignmentIntegrity returns valid when schedule, membership and capability match", async () => {
  const realDate = Date;
  global.Date = class extends Date {
    constructor(value?: string | number | Date) {
      super(value ?? "2026-04-10T09:00:00.000Z");
    }

    static now() {
      return new realDate("2026-04-10T09:00:00.000Z").getTime();
    }
  } as DateConstructor;

  const supabaseMock = {
    from(table: string) {
      if (table === "schedules") {
        return createQueryBuilder({
          single: {
            data: {
              id: "schedule-1",
              ministry_id: "ministry-1",
              events: {
                id: "event-1",
                start_at: "2026-04-11T18:00:00.000Z",
                end_at: null,
              },
            },
          },
        });
      }

      if (table === "ministry_roles") {
        return createQueryBuilder({
          single: {
            data: {
              id: "role-1",
              ministry_id: "ministry-1",
            },
          },
        });
      }

      if (table === "ministry_members") {
        return createQueryBuilder({
          maybeSingle: {
            data: { id: "member-1" },
          },
        });
      }

      if (table === "ministry_member_roles") {
        return createQueryBuilder({
          maybeSingle: {
            data: { id: "capability-1" },
          },
        });
      }

      if (table === "schedule_assignments") {
        return createQueryBuilder({
          maybeSingle: {
            data: null,
          },
        });
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };

  const { validateScheduleAssignmentIntegrity } = loadServiceModule<{
    validateScheduleAssignmentIntegrity: (
      scheduleId: string,
      userId: string,
      roleId: string,
    ) => Promise<{
      isValid: boolean;
      isEventEditable: boolean;
      isRoleFromScheduleMinistry: boolean;
      isUserMemberOfScheduleMinistry: boolean;
      doesUserHaveCapability: boolean;
      error: string | null;
    }>;
  }>("../src/services/scheduleService", supabaseMock);

  const result = await validateScheduleAssignmentIntegrity(
    "schedule-1",
    "user-1",
    "role-1",
  );

  global.Date = realDate;

  assert.deepEqual(result, {
    isValid: true,
    isEventEditable: true,
    isRoleFromScheduleMinistry: true,
    isUserMemberOfScheduleMinistry: true,
    doesUserHaveCapability: true,
    error: null,
  });
});

test("validateScheduleAssignmentIntegrity rejects members already assigned in the schedule", async () => {
  const realDate = Date;
  global.Date = class extends Date {
    constructor(value?: string | number | Date) {
      super(value ?? "2026-04-10T09:00:00.000Z");
    }

    static now() {
      return new realDate("2026-04-10T09:00:00.000Z").getTime();
    }
  } as DateConstructor;

  const supabaseMock = {
    from(table: string) {
      if (table === "schedules") {
        return createQueryBuilder({
          single: {
            data: {
              id: "schedule-1",
              ministry_id: "ministry-1",
              events: {
                id: "event-1",
                start_at: "2026-04-11T18:00:00.000Z",
                end_at: null,
              },
            },
          },
        });
      }

      if (table === "ministry_roles") {
        return createQueryBuilder({
          single: {
            data: {
              id: "role-2",
              ministry_id: "ministry-1",
            },
          },
        });
      }

      if (table === "ministry_members") {
        return createQueryBuilder({
          maybeSingle: {
            data: { id: "member-1" },
          },
        });
      }

      if (table === "ministry_member_roles") {
        return createQueryBuilder({
          maybeSingle: {
            data: { id: "capability-1" },
          },
        });
      }

      if (table === "schedule_assignments") {
        return createQueryBuilder({
          maybeSingle: {
            data: { id: "assignment-1" },
          },
        });
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };

  const { validateScheduleAssignmentIntegrity } = loadServiceModule<{
    validateScheduleAssignmentIntegrity: (
      scheduleId: string,
      userId: string,
      roleId: string,
    ) => Promise<{
      isValid: boolean;
      error: string | null;
    }>;
  }>("../src/services/scheduleService", supabaseMock);

  const result = await validateScheduleAssignmentIntegrity(
    "schedule-1",
    "user-1",
    "role-2",
  );

  global.Date = realDate;

  assert.equal(result.isValid, false);
  assert.equal(result.error, "Membro ja esta escalado nesta escala.");
});

test("upsertScheduleAssignmentValidated does not upsert when integrity validation fails", async () => {
  const realDate = Date;
  global.Date = class extends Date {
    constructor(value?: string | number | Date) {
      super(value ?? "2026-04-10T09:00:00.000Z");
    }

    static now() {
      return new realDate("2026-04-10T09:00:00.000Z").getTime();
    }
  } as DateConstructor;

  const upsertCalls: unknown[] = [];
  const supabaseMock = {
    from(table: string) {
      if (table === "schedules") {
        return createQueryBuilder({
          single: {
            data: {
              id: "schedule-1",
              ministry_id: "ministry-1",
              events: {
                id: "event-1",
                start_at: "2026-04-11T18:00:00.000Z",
                end_at: null,
              },
            },
          },
        });
      }

      if (table === "ministry_roles") {
        return createQueryBuilder({
          single: {
            data: {
              id: "role-1",
              ministry_id: "ministry-2",
            },
          },
        });
      }

      if (table === "schedule_assignments") {
        const builder = createQueryBuilder();
        builder.upsert = (...args: unknown[]) => {
          upsertCalls.push(args);
          return builder;
        };
        return builder;
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };

  const { upsertScheduleAssignmentValidated } = loadServiceModule<{
    upsertScheduleAssignmentValidated: (input: {
      scheduleId: string;
      userId: string;
      roleId: string;
      status?: "pending" | "confirmed" | "declined" | "swapped";
    }) => Promise<{ data: unknown; error: string | null }>;
  }>("../src/services/scheduleService", supabaseMock);

  const result = await upsertScheduleAssignmentValidated({
    scheduleId: "schedule-1",
    userId: "user-1",
    roleId: "role-1",
  });

  global.Date = realDate;

  assert.equal(
    result.error,
    "A funcao selecionada nao pertence ao ministerio da escala.",
  );
  assert.equal(result.data, null);
  assert.deepEqual(upsertCalls, []);
});

test("upsertScheduleAssignmentValidated uses pending as the default status", async () => {
  const realDate = Date;
  global.Date = class extends Date {
    constructor(value?: string | number | Date) {
      super(value ?? "2026-04-10T09:00:00.000Z");
    }

    static now() {
      return new realDate("2026-04-10T09:00:00.000Z").getTime();
    }
  } as DateConstructor;

  const upsertCalls: unknown[] = [];
  const supabaseMock = {
    from(table: string) {
      if (table === "schedules") {
        return createQueryBuilder({
          single: {
            data: {
              id: "schedule-1",
              ministry_id: "ministry-1",
              events: {
                id: "event-1",
                start_at: "2026-04-11T18:00:00.000Z",
                end_at: null,
              },
            },
          },
        });
      }

      if (table === "ministry_roles") {
        return createQueryBuilder({
          single: {
            data: {
              id: "role-1",
              ministry_id: "ministry-1",
            },
          },
        });
      }

      if (table === "ministry_members") {
        return createQueryBuilder({
          maybeSingle: {
            data: { id: "member-1" },
          },
        });
      }

      if (table === "ministry_member_roles") {
        return createQueryBuilder({
          maybeSingle: {
            data: { id: "capability-1" },
          },
        });
      }

      if (table === "schedule_assignments") {
        const builder = createQueryBuilder({
          maybeSingle: {
            data: null,
          },
          single: {
            data: {
              id: "assignment-1",
              schedule_id: "schedule-1",
              user_id: "user-1",
              role_id: "role-1",
              status: "pending",
            },
          },
        });
        const originalUpsert = builder.upsert;

        builder.upsert = (...args: unknown[]) => {
          upsertCalls.push(args);
          return originalUpsert(...args);
        };

        return builder;
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };

  const { upsertScheduleAssignmentValidated } = loadServiceModule<{
    upsertScheduleAssignmentValidated: (input: {
      scheduleId: string;
      userId: string;
      roleId: string;
      status?: "pending" | "confirmed" | "declined" | "swapped";
    }) => Promise<{ data: { status: string } | null; error: string | null }>;
  }>("../src/services/scheduleService", supabaseMock);

  const result = await upsertScheduleAssignmentValidated({
    scheduleId: "schedule-1",
    userId: "user-1",
    roleId: "role-1",
  });

  global.Date = realDate;

  assert.equal(result.error, null);
  assert.equal(result.data?.status, "pending");
  assert.deepEqual(upsertCalls, [
    [
      [
        {
          schedule_id: "schedule-1",
          user_id: "user-1",
          role_id: "role-1",
          status: "pending",
        },
      ],
      {
        onConflict: "schedule_id,user_id,role_id",
      },
    ],
  ]);
});

test("getAssignmentWarningsForSchedule returns blocked date and conflict warnings", async () => {
  const supabaseMock = {
    from(table: string) {
      if (table === "schedules") {
        return createQueryBuilder({
          single: {
            data: {
              id: "schedule-1",
              ministry_id: "ministry-1",
              events: {
                id: "event-1",
                start_at: "2026-04-11T18:00:00.000Z",
                end_at: "2026-04-11T20:00:00.000Z",
              },
            },
          },
        });
      }

      if (table === "blocked_dates") {
        return createQueryBuilder({
          maybeSingle: {
            data: {
              id: "blocked-1",
              date: "2026-04-11",
            },
          },
        });
      }

      if (table === "schedule_assignments") {
        return createQueryBuilder({
          select: {
            data: [
              {
                id: "assignment-other",
                status: "confirmed",
                schedules: {
                  id: "schedule-2",
                  event_id: "event-2",
                  ministries: { name: "Louvor" },
                  events: {
                    id: "event-2",
                    title: "Ensaio Geral",
                    start_at: "2026-04-11T19:00:00.000Z",
                    end_at: "2026-04-11T21:00:00.000Z",
                  },
                },
                ministry_roles: { name: "Vocal" },
              },
              {
                id: "assignment-same-event",
                status: "confirmed",
                schedules: {
                  id: "schedule-3",
                  event_id: "event-1",
                  ministries: { name: "Midia" },
                  events: {
                    id: "event-1",
                    title: "Mesmo Evento",
                    start_at: "2026-04-11T18:00:00.000Z",
                    end_at: "2026-04-11T20:00:00.000Z",
                  },
                },
                ministry_roles: { name: "Camera" },
              },
            ],
          },
        });
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };

  const { getAssignmentWarningsForSchedule } = loadServiceModule<{
    getAssignmentWarningsForSchedule: (input: {
      scheduleId: string;
      userId: string;
    }) => Promise<{
      data: Array<{ type: string; event_title?: string; date?: string }> | null;
      error: string | null;
    }>;
  }>("../src/services/scheduleService", supabaseMock);

  const result = await getAssignmentWarningsForSchedule({
    scheduleId: "schedule-1",
    userId: "user-1",
  });

  assert.equal(result.error, null);
  assert.deepEqual(result.data, [
    { type: "blocked_date", date: "2026-04-11" },
    {
      type: "conflict",
      event_id: "event-2",
      event_title: "Ensaio Geral",
      ministry_name: "Louvor",
      role_name: "Vocal",
      start_at: "2026-04-11T19:00:00.000Z",
      end_at: "2026-04-11T21:00:00.000Z",
    },
  ]);
});

test("getMinistryMembersOptions hydrates names through the visible-profile lookup", async () => {
  const selections: string[] = [];
  const profileLookupCalls: string[][] = [];
  const supabaseMock = {
    from(table: string) {
      assert.equal(table, "ministry_members");
      const builder = createQueryBuilder({
        select: {
          data: [
            {
              user_id: "user-1",
              ministry_member_roles: [{ role_id: "role-1" }],
            },
          ],
        },
      });
      const select = builder.select;
      builder.select = (selection: string) => {
        selections.push(selection);
        return select(selection);
      };
      return builder;
    },
  };

  const { getMinistryMembersOptions } = loadScheduleServiceWithProfileLookup(
    supabaseMock,
    (userIds) => {
      profileLookupCalls.push(userIds);
      return Promise.resolve({
        data: [
          {
            id: "user-1",
            full_name: "Lia Santos",
            avatar_url: "https://example.com/lia.png",
          },
        ],
        error: null,
      });
    },
  );

  const result = await getMinistryMembersOptions("ministry-1");

  assert.equal(result.error, null);
  assert.deepEqual(profileLookupCalls, [["user-1"]]);
  assert.doesNotMatch(selections[0] ?? "", /profiles/i);
  assert.deepEqual(result.data, [
    {
      user_id: "user-1",
      full_name: "Lia Santos",
      avatar_url: "https://example.com/lia.png",
      capability_role_ids: ["role-1"],
    },
  ]);
});

test("getMinistryMembersOptions returns the controlled lookup error", async () => {
  const supabaseMock = {
    from(table: string) {
      assert.equal(table, "ministry_members");
      return createQueryBuilder({
        select: {
          data: [
            {
              user_id: "user-1",
              ministry_member_roles: [],
            },
          ],
        },
      });
    },
  };

  const { getMinistryMembersOptions } = loadScheduleServiceWithProfileLookup(
    supabaseMock,
    () => Promise.resolve({ data: null, error: "Nao foi possivel carregar os perfis." }),
  );

  const result = await getMinistryMembersOptions("ministry-1");

  assert.equal(result.data, null);
  assert.equal(result.error, "Nao foi possivel carregar os perfis.");
});
