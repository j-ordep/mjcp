type EventTimeFilter = "current" | "past";

type EventTimeLike = {
  start_at: string;
  end_at?: string | null;
};

function getEventBoundaryTime(event: EventTimeLike) {
  return new Date(event.end_at || event.start_at).getTime();
}

export function matchesEventTimeFilter(
  event: EventTimeLike,
  filter: EventTimeFilter,
  now: number,
) {
  const boundaryTime = getEventBoundaryTime(event);

  return filter === "current" ? boundaryTime > now : boundaryTime <= now;
}

export function compareEventDatesByFilter(
  left: EventTimeLike,
  right: EventTimeLike,
  filter: EventTimeFilter,
) {
  const leftStart = new Date(left.start_at).getTime();
  const rightStart = new Date(right.start_at).getTime();

  return filter === "past"
    ? rightStart - leftStart
    : leftStart - rightStart;
}
