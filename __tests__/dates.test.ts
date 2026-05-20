import { describe, expect, it } from "vitest";

import {
  formatDateStringForDisplay,
  formatDateTimeInZone,
  getMonthGrid,
} from "@/lib/dates";

describe("date helpers", () => {
  it("builds month grids from Monday through Sunday", () => {
    const grid = getMonthGrid("2026-05");

    expect(grid[0]).toMatchObject({
      date: "2026-04-27",
      dayNumber: "27",
      inMonth: false,
    });
    expect(grid[6]).toMatchObject({
      date: "2026-05-03",
      dayNumber: "3",
      inMonth: true,
    });
    expect(grid.at(-1)).toMatchObject({
      date: "2026-05-31",
      dayNumber: "31",
      inMonth: true,
    });
  });

  it("formats visible dates as dd/MM/yyyy", () => {
    expect(formatDateStringForDisplay("2026-05-20")).toBe("20/05/2026");
    expect(
      formatDateTimeInZone(
        new Date("2026-05-20T09:30:00.000Z"),
        "Europe/Sofia"
      )
    ).toBe("20/05/2026 12:30");
  });
});
