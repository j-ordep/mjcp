const EVENT_DEFAULT_DURATION_MS = 3 * 60 * 60 * 1000;

export interface NormalizedEventRange {
  startAt: string;
  endAt: string;
}

export function getNow() {
  return new Date();
}

export function formatTimeFromDate(date: Date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createLocalDateTime(dateKey: string, time: string) {
  return new Date(`${dateKey}T${time}:00`);
}

export function getDefaultEndAt(startAt: Date) {
  return new Date(startAt.getTime() + EVENT_DEFAULT_DURATION_MS);
}

export function normalizeEventRange(input: {
  startAt?: string | null;
  endAt?: string | null;
  requireFutureStart?: boolean;
}): { data: NormalizedEventRange | null; error: string | null } {
  const startDate = input.startAt ? new Date(input.startAt) : getNow();

  if (Number.isNaN(startDate.getTime())) {
    return { data: null, error: 'Data inicial invalida.' };
  }

  if (input.requireFutureStart && startDate.getTime() < Date.now()) {
    return { data: null, error: 'Nao e permitido criar evento com data/hora no passado.' };
  }

  const endDate = input.endAt ? new Date(input.endAt) : getDefaultEndAt(startDate);

  if (Number.isNaN(endDate.getTime())) {
    return { data: null, error: 'Data final invalida.' };
  }

  if (endDate.getTime() <= startDate.getTime()) {
    return { data: null, error: 'A data final deve ser maior que a data inicial.' };
  }

  return {
    data: {
      startAt: startDate.toISOString(),
      endAt: endDate.toISOString(),
    },
    error: null,
  };
}
