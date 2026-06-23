import { describe, expect, it } from "vitest";

import {
  LAST_OPENED_MONTH_COOKIE_MAX_AGE,
  lastOpenedMonthCookieName,
} from "@/lib/month-preferences";

describe("month preferences", () => {
  it("creates a stable per-calendar cookie name", () => {
    expect(
      lastOpenedMonthCookieName("327ce666-31b3-438c-b485-06441dbfad5e")
    ).toBe(
      "calendar_service_last_month_327ce666-31b3-438c-b485-06441dbfad5e"
    );
  });

  it("keeps the month preference for one year", () => {
    expect(LAST_OPENED_MONTH_COOKIE_MAX_AGE).toBe(31_536_000);
  });
});
