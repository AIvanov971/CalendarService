export const LAST_OPENED_MONTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function lastOpenedMonthCookieName(calendarId: string) {
  return `calendar_service_last_month_${calendarId}`;
}
