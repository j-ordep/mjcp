export function getProfileInitials(name?: string | null) {
  const normalized = (name ?? "").trim();

  if (!normalized) {
    return "MJ";
  }

  const parts = normalized.split(/\s+/).filter(Boolean).slice(0, 2);

  if (parts.length === 0) {
    return "MJ";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function getProfileAvatarUri(avatarUrl?: string | null) {
  const normalized = avatarUrl?.trim();

  return normalized ? normalized : undefined;
}

export function formatProfilePhone(phone?: string | null) {
  const clean = (phone ?? "").replace(/\D/g, "");

  if (!clean) {
    return "Não informado";
  }

  if (clean.length <= 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6, 10)}`.trim();
  }

  return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`.trim();
}
