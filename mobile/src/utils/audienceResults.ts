type AudienceLike = {
  id: string;
};

type AudienceMode = 'replace' | 'append';

interface ResolveAudienceResponseOptions<T extends AudienceLike> {
  current: T[];
  incoming: T[];
  mode: AudienceMode;
  page: number;
  hasMore: boolean;
  requestId: number;
  latestRequestId: number;
  isPublic: boolean;
}

function mergeUniqueAudience<T extends AudienceLike>(profiles: T[]) {
  const seenIds = new Set<string>();

  return profiles.filter((profile) => {
    if (seenIds.has(profile.id)) {
      return false;
    }

    seenIds.add(profile.id);
    return true;
  });
}

export function resolveAudienceResponse<T extends AudienceLike>({
  current,
  incoming,
  mode,
  page,
  hasMore,
  requestId,
  latestRequestId,
  isPublic,
}: ResolveAudienceResponseOptions<T>) {
  if (isPublic || requestId !== latestRequestId) {
    return {
      shouldApply: false,
      page: null,
      hasMore: false,
      results: current,
    };
  }

  return {
    shouldApply: true,
    page,
    hasMore,
    results:
      mode === 'append'
        ? mergeUniqueAudience([...current, ...incoming])
        : incoming,
  };
}
