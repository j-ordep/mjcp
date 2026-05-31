const TECHNICAL_MESSAGE_PATTERNS = [
  /row-level security/i,
  /\brls\b/i,
  /violates/i,
  /constraint/i,
  /duplicate key/i,
  /invalid input syntax/i,
  /\bjwt\b/i,
  /\brpc\b/i,
  /\bsql\b/i,
  /postgres/i,
  /supabase/i,
  /permission denied/i,
  /network request failed/i,
  /fetch failed/i,
  /auth api/i,
  /pgrst/i,
  /foreign key/i,
  /column .* does not exist/i,
  /syntax error/i,
  /could not find the function/i,
];

function normalizeMessage(message: string) {
  return message.trim().replace(/\s+/g, " ");
}

function isTechnicalMessage(message: string) {
  return TECHNICAL_MESSAGE_PATTERNS.some((pattern) => pattern.test(message));
}

function isSafeUserMessage(message: string) {
  if (!message) return false;
  if (message.length > 180) return false;
  if (isTechnicalMessage(message)) return false;

  return true;
}

export function getRawErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return normalizeMessage(error.message);
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return normalizeMessage(error.message);
  }

  if (typeof error === "string") {
    return normalizeMessage(error);
  }

  return "";
}

export function getGenericUserFacingError(error: unknown, fallback: string): string {
  const rawMessage = getRawErrorMessage(error);

  if (isSafeUserMessage(rawMessage)) {
    return rawMessage;
  }

  return fallback;
}

export function getAuthUserFacingError(
  _error: unknown,
  mode: "sign_in" | "sign_up" | "sign_out",
): string {
  const authFallbacks = {
    sign_in: "Nao foi possivel entrar. Confira seus dados e tente novamente.",
    sign_up: "Nao foi possivel concluir o cadastro. Tente novamente em alguns instantes.",
    sign_out: "Nao foi possivel sair agora. Tente novamente em alguns instantes.",
  } as const;

  return authFallbacks[mode];
}
