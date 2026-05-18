export function normalizeAudienceUserIds(userIds: string[] | undefined) {
  return Array.from(
    new Set((userIds ?? []).map((userId) => userId.trim()).filter(Boolean)),
  );
}
