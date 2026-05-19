import { describe, expect, it } from "vitest";

import type { Calendar, Event } from "@/db/schema";
import { buildCalendarIcs } from "@/lib/ical";

const calendar: Calendar = {
  id: "0f7fe9f0-8393-43ba-9d2a-f5c7d2999174",
  name: "Team Calendar",
  slug: "team-calendar",
  color: "#7c3aed",
  timezone: "Europe/Sofia",
  isArchived: false,
  createdAt: new Date("2026-05-01T08:00:00.000Z"),
  updatedAt: new Date("2026-05-05T09:00:00.000Z"),
};

function event(overrides: Partial<Event>): Event {
  return {
    id: "2d807e55-35f4-44d0-9b5c-8b563d3ad898",
    calendarId: calendar.id,
    kind: "timed",
    title: "Board review",
    description: "Quarterly sync",
    location: "Room 2",
    startsAt: new Date("2026-05-19T07:00:00.000Z"),
    endsAt: new Date("2026-05-19T08:00:00.000Z"),
    allDayStart: null,
    allDayEnd: null,
    timezone: "Europe/Sofia",
    sequence: 0,
    createdAt: new Date("2026-05-01T08:00:00.000Z"),
    updatedAt: new Date("2026-05-02T08:00:00.000Z"),
    ...overrides,
  };
}

describe("buildCalendarIcs", () => {
  it("generates stable timed VEVENT data", () => {
    const ics = buildCalendarIcs({
      calendar,
      events: [event({})],
      feedUrl: "https://example.com/api/feeds/token/calendar.ics",
    });

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("METHOD:PUBLISH");
    expect(ics).toContain(
      "UID:2d807e55-35f4-44d0-9b5c-8b563d3ad898@calendar-service"
    );
    expect(ics).toContain("SUMMARY:Board review");
    expect(ics).toContain("DESCRIPTION:Quarterly sync");
    expect(ics).toContain("LOCATION:Room 2");
    expect(ics).toContain("DTSTART:20260519T070000Z");
    expect(ics).toContain("DTEND:20260519T080000Z");
    expect(ics).toContain("SEQUENCE:0");
  });

  it("emits all-day events as date-only exclusive ranges", () => {
    const ics = buildCalendarIcs({
      calendar,
      events: [
        event({
          id: "84f72651-7267-4dc9-9675-75b7041209c1",
          kind: "all_day",
          title: "Company offsite",
          startsAt: null,
          endsAt: null,
          allDayStart: "2026-05-20",
          allDayEnd: "2026-05-22",
        }),
      ],
    });

    expect(ics).toContain("SUMMARY:Company offsite");
    expect(ics).toContain("DTSTART;VALUE=DATE:20260520");
    expect(ics).toContain("DTEND;VALUE=DATE:20260522");
  });

  it("escapes user-provided text", () => {
    const ics = buildCalendarIcs({
      calendar,
      events: [
        event({
          title: "Planning, launch",
          description: "Line one\nLine two",
        }),
      ],
    });

    expect(ics).toContain("SUMMARY:Planning\\, launch");
    expect(ics).toContain("DESCRIPTION:Line one\\nLine two");
  });
});
