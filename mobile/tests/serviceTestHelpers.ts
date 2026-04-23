type MockResponse<T = unknown> = {
  data?: T;
  error?: { message: string } | null;
};

type MockFn = (...args: any[]) => any;

interface QueryBuilder {
  select: MockFn;
  eq: MockFn;
  in: MockFn;
  upsert: MockFn;
  insert: MockFn;
  update: MockFn;
  delete: MockFn;
  single: MockFn;
  maybeSingle: MockFn;
  order: MockFn;
  gte: MockFn;
  neq: MockFn;
  then: PromiseLike<{
    data: unknown;
    error: { message: string } | null;
  }>["then"];
}

export function createQueryBuilder(
  terminal: {
    single?: MockResponse;
    maybeSingle?: MockResponse;
    select?: MockResponse;
    delete?: MockResponse;
    insert?: MockResponse;
    update?: MockResponse;
    upsert?: MockResponse;
  } = {},
) {
  const builder = {} as QueryBuilder;
  let lastOperation:
    | "select"
    | "delete"
    | "insert"
    | "update"
    | "upsert"
    | null = null;

  builder.select = (..._args: any[]) => {
    lastOperation = "select";
    return builder;
  };
  builder.eq = (..._args: any[]) => builder;
  builder.in = (..._args: any[]) => builder;
  builder.order = (..._args: any[]) => builder;
  builder.gte = (..._args: any[]) => builder;
  builder.neq = (..._args: any[]) => builder;
  builder.upsert = (..._args: any[]) => {
    lastOperation = "upsert";
    return builder;
  };
  builder.insert = (..._args: any[]) => {
    lastOperation = "insert";
    return builder;
  };
  builder.update = (..._args: any[]) => {
    lastOperation = "update";
    return builder;
  };
  builder.delete = (..._args: any[]) => {
    lastOperation = "delete";
    return builder;
  };
  builder.single = async () => ({
    data: terminal.single?.data ?? null,
    error: terminal.single?.error ?? null,
  });
  builder.maybeSingle = async () => ({
    data: terminal.maybeSingle?.data ?? null,
    error: terminal.maybeSingle?.error ?? null,
  });
  builder.then = (onfulfilled, onrejected) => {
    const response =
      lastOperation === "select"
        ? terminal.select
        : lastOperation === "delete"
          ? terminal.delete
          : lastOperation === "insert"
            ? terminal.insert
            : lastOperation === "update"
              ? terminal.update
              : lastOperation === "upsert"
                ? terminal.upsert
                : undefined;

    return Promise.resolve({
      data: response?.data ?? null,
      error: response?.error ?? null,
    }).then(onfulfilled, onrejected);
  };

  return builder;
}

export function loadServiceModule<T>(modulePath: string, supabaseMock: unknown): T {
  const supabaseModulePath = require.resolve("../src/lib/supabase");
  const targetModulePath = require.resolve(modulePath);

  delete require.cache[targetModulePath];
  require.cache[supabaseModulePath] = ({
    id: supabaseModulePath,
    filename: supabaseModulePath,
    loaded: true,
    exports: { supabase: supabaseMock },
    children: [],
    paths: [],
  } as unknown) as NodeJS.Module;

  return require(modulePath) as T;
}
