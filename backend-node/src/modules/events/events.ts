export type EventCategory =
  | "geral"
  | "culto"
  | "ensino"
  | "jovens"
  | "oração"
  | "reunião"
  | "especial";

export type ChurchEvent = {
  id: string;
  title: string;
  category: EventCategory;
  description: string | null;
  location: string | null;
  startAt: Date;
  endAt: Date | null;
  isPublic: boolean;
};

export function isEventPeriodValid(startAt: Date, endAt: Date | null): boolean {
  return endAt === null || endAt > startAt;
}