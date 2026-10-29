const TIME_ZONE = process.env.APP_TIMEZONE || "America/Sao_Paulo";

/** "2026-10-29T20:30" -> "29/10 20:30" */
export function formatDateTime(value: string): string {
  const [date, time = ""] = value.split("T");
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return value;
  const shortTime = time.slice(0, 5);
  return shortTime ? `${day}/${month}/${year} ${shortTime}` : `${day}/${month}/${year}`;
}

/** "2026-10-29T20:30" -> "29/10" */
export function formatShortDate(value: string): string {
  const [date] = value.split("T");
  const [, month, day] = date.split("-");
  if (!month || !day) return value;
  return `${day}/${month}`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(value > 0 && value < 10 ? 1 : 0)}%`;
}

/** Valor no formato aceito por <input type="datetime-local"> para "agora". */
export function nowForDateTimeInput(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** Normaliza a data digitada no formulário para "YYYY-MM-DDTHH:mm". */
export function normalizeDateTimeInput(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value.trim());
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const yearNum = Number(year);
  const monthNum = Number(month);
  const dayNum = Number(day);
  const hourNum = Number(hour);
  const minuteNum = Number(minute);
  if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31 || hourNum > 23 || minuteNum > 59) {
    return null;
  }
  if (yearNum < 1900 || yearNum > 2200) return null;
  return `${year}-${month}-${day}T${hour}:${minute}`;
}
