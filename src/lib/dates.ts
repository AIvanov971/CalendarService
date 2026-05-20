import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parse,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

export const DEFAULT_TIMEZONE = "Europe/Sofia";
export const DISPLAY_DATE_FORMAT = "dd/MM/yyyy";

export function normalizeMonth(month?: string | null) {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    return month;
  }

  return format(new Date(), "yyyy-MM");
}

export function getMonthBounds(month: string, timezone = DEFAULT_TIMEZONE) {
  const monthStartLocal = `${month}-01T00:00:00`;
  const startDate = parse(`${month}-01`, "yyyy-MM-dd", new Date());
  const nextMonth = format(addMonths(startDate, 1), "yyyy-MM");
  const nextMonthStartLocal = `${nextMonth}-01T00:00:00`;

  return {
    month,
    startDate,
    startDateString: `${month}-01`,
    endDateString: `${nextMonth}-01`,
    startUtc: fromZonedTime(monthStartLocal, timezone),
    endUtc: fromZonedTime(nextMonthStartLocal, timezone),
    previousMonth: format(addMonths(startDate, -1), "yyyy-MM"),
    nextMonth,
  };
}

export function getMonthGrid(month: string) {
  const monthStart = parse(`${month}-01`, "yyyy-MM-dd", new Date());
  const first = startOfMonth(monthStart);
  const last = endOfMonth(monthStart);
  const gridStart = startOfWeek(first, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(last, { weekStartsOn: 1 });

  return eachDayOfInterval({ start: gridStart, end: gridEnd }).map((day) => ({
    date: format(day, "yyyy-MM-dd"),
    dayNumber: format(day, "d"),
    inMonth: isSameMonth(day, first),
  }));
}

export function toUtcFromLocalDateTime(value: string, timezone: string) {
  return fromZonedTime(value, timezone);
}

export function formatDateTimeInZone(date: Date, timezone: string) {
  return formatInTimeZone(date, timezone, `${DISPLAY_DATE_FORMAT} HH:mm`);
}

export function formatTimeInZone(date: Date, timezone: string) {
  return formatInTimeZone(date, timezone, "HH:mm");
}

export function formatDateInZone(date: Date, timezone: string) {
  return formatInTimeZone(date, timezone, "yyyy-MM-dd");
}

export function formatDateStringForDisplay(dateString: string) {
  return format(
    parse(dateString, "yyyy-MM-dd", new Date()),
    DISPLAY_DATE_FORMAT
  );
}

export function toDateTimeLocalValue(date: Date, timezone: string) {
  return format(toZonedTime(date, timezone), "yyyy-MM-dd'T'HH:mm");
}
