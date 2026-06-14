export const APP_BOOTSTRAP_ENV_ERROR =
  "Configure as variaveis publicas do Supabase antes de abrir o app.";

interface PublicSupabaseConfig {
  supabaseUrl: string;
  supabasePublishableKey: string;
}

interface PublicSupabaseConfigResult {
  data: PublicSupabaseConfig | null;
  error: string | null;
}

function readEnvValue(
  env: Record<string, string | undefined>,
  name: "EXPO_PUBLIC_SUPABASE_URL" | "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
) {
  return env[name]?.trim() ?? "";
}

function isPlaceholderValue(value: string) {
  return (
    !value ||
    value.includes("******") ||
    /your_|change[_-]?me|placeholder|example/i.test(value)
  );
}

function isValidPublicUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function getPublicSupabaseConfig(
  env: Record<string, string | undefined> = process.env,
): PublicSupabaseConfigResult {
  const supabaseUrl = readEnvValue(env, "EXPO_PUBLIC_SUPABASE_URL");
  const supabasePublishableKey = readEnvValue(
    env,
    "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  );

  if (
    isPlaceholderValue(supabaseUrl) ||
    isPlaceholderValue(supabasePublishableKey) ||
    !isValidPublicUrl(supabaseUrl)
  ) {
    return {
      data: null,
      error: APP_BOOTSTRAP_ENV_ERROR,
    };
  }

  return {
    data: {
      supabaseUrl,
      supabasePublishableKey,
    },
    error: null,
  };
}

export function getPublicSupabaseConfigOrThrow(
  env: Record<string, string | undefined> = process.env,
) {
  const result = getPublicSupabaseConfig(env);

  if (!result.data || result.error) {
    throw new Error(result.error ?? APP_BOOTSTRAP_ENV_ERROR);
  }

  return result.data;
}
