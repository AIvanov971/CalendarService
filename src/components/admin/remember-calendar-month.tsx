"use client";

import { useEffect } from "react";

import {
  LAST_OPENED_MONTH_COOKIE_MAX_AGE,
  lastOpenedMonthCookieName,
} from "@/lib/month-preferences";

type RememberCalendarMonthProps = {
  calendarId: string;
  month: string;
};

export function RememberCalendarMonth({
  calendarId,
  month,
}: RememberCalendarMonthProps) {
  useEffect(() => {
    document.cookie = [
      `${lastOpenedMonthCookieName(calendarId)}=${encodeURIComponent(month)}`,
      "Path=/admin",
      `Max-Age=${LAST_OPENED_MONTH_COOKIE_MAX_AGE}`,
      "SameSite=Lax",
    ].join("; ");
  }, [calendarId, month]);

  return null;
}
