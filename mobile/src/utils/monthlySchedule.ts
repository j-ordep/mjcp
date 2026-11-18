/** Today's civil date in the church's timezone, independent of the device timezone. */
export function getChurchDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  return ["year", "month", "day"].map((type) => parts.find((part) => part.type === type)!.value).join("-");
}

/** UTC is used only for calendar arithmetic/labels; the returned date stays civil. */
export function getMonthDays(month: string) {
  if (!/^(?!0000)\d{4}-(0[1-9]|1[0-2])$/.test(month)) return [];
  const cursor = new Date(`${month}-01T12:00:00Z`);
  const days: { date: string; weekday: number; label: string }[] = [];
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC", weekday: "short", day: "2-digit", month: "short",
  });
  while (cursor.toISOString().startsWith(month)) {
    days.push({ date: cursor.toISOString().slice(0, 10), weekday: cursor.getUTCDay(), label: formatter.format(cursor) });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}
