export const EVENT_CATEGORY_OPTIONS = [
  {
    value: "geral",
    label: "Geral",
    backgroundColor: "#f3f4f6",
    textColor: "#111827",
    accentColor: "#111827",
  },
  {
    value: "culto",
    label: "Culto",
    backgroundColor: "#f3f4f6",
    textColor: "#111827",
    accentColor: "#111827",
  },
  {
    value: "ensino",
    label: "Ensino",
    backgroundColor: "#f3f4f6",
    textColor: "#111827",
    accentColor: "#111827",
  },
  {
    value: "jovens",
    label: "Jovens",
    backgroundColor: "#f3f4f6",
    textColor: "#111827",
    accentColor: "#111827",
  },
  {
    value: "oração",
    label: "Oração",
    backgroundColor: "#f3f4f6",
    textColor: "#111827",
    accentColor: "#111827",
  },
  {
    value: "reunião",
    label: "Reunião",
    backgroundColor: "#f3f4f6",
    textColor: "#111827",
    accentColor: "#111827",
  },
  {
    value: "especial",
    label: "Especial",
    backgroundColor: "#f3f4f6",
    textColor: "#111827",
    accentColor: "#111827",
  },
] as const;

export type EventCategory = (typeof EVENT_CATEGORY_OPTIONS)[number]["value"];

const EVENT_CATEGORY_LABELS = new Map(
  EVENT_CATEGORY_OPTIONS.map((option) => [option.value, option.label]),
);

export function normalizeEventCategory(
  value: string | null | undefined,
): EventCategory {
  const option = EVENT_CATEGORY_OPTIONS.find((item) => item.value === value);
  return option?.value ?? "geral";
}

export function getEventCategoryLabel(value: string | null | undefined) {
  const category = normalizeEventCategory(value);
  return EVENT_CATEGORY_LABELS.get(category) ?? "Geral";
}

export function getEventCategoryOption(value: string | null | undefined) {
  const category = normalizeEventCategory(value);
  return (
    EVENT_CATEGORY_OPTIONS.find((option) => option.value === category) ??
    EVENT_CATEGORY_OPTIONS[0]
  );
}
