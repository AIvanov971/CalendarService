import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Calendar, Event, SubscriptionLink } from "@/db/schema";

vi.mock("@/lib/calendar-data", () => ({
  getFeedEvents: vi.fn(),
  getLastModified: vi.fn(),
  getSubscriptionByToken: vi.fn(),
  markSubscriptionAccessed: vi.fn(),
}));

vi.mock("@/lib/url", () => ({
  buildFeedUrl: vi.fn(
    (baseUrl: string, token: string) =>
      `${baseUrl}/api/feeds/${token}/calendar.ics`
  ),
  getBaseUrl: vi.fn(async () => "https://calendar.example.com"),
}));

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

const link: SubscriptionLink = {
  id: "557e3aa4-b07b-42aa-a3d0-a6009712feaf",
  calendarId: calendar.id,
  label: "Public",
  tokenHash: "hash",
  revokedAt: null,
  lastAccessedAt: null,
  createdAt: new Date("2026-05-01T08:00:00.000Z"),
};

const feedEvent: Event = {
  id: "2d807e55-35f4-44d0-9b5c-8b563d3ad898",
  calendarId: calendar.id,
  kind: "timed",
  title: "Board review",
  description: null,
  location: null,
  startsAt: new Date("2026-05-19T07:00:00.000Z"),
  endsAt: new Date("2026-05-19T08:00:00.000Z"),
  allDayStart: null,
  allDayEnd: null,
  timezone: "Europe/Sofia",
  sequence: 0,
  createdAt: new Date("2026-05-01T08:00:00.000Z"),
  updatedAt: new Date("2026-05-02T08:00:00.000Z"),
};

describe("feed route", () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    const data = await import("@/lib/calendar-data");

    vi.mocked(data.getSubscriptionByToken).mockResolvedValue({
      calendar,
      link,
    });
    vi.mocked(data.getFeedEvents).mockResolvedValue([feedEvent]);
    vi.mocked(data.getLastModified).mockReturnValue(
      new Date("2026-05-05T09:00:00.000Z")
    );
  });

  it("returns a calendar feed for a valid token", async () => {
    const { GET } = await import(
      "@/app/api/feeds/[token]/calendar.ics/route"
    );
    const response = await GET(new Request("https://test.local"), {
      params: Promise.resolve({ token: "raw-token" }),
    });
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "text/calendar; charset=utf-8"
    );
    expect(response.headers.get("etag")).toMatch(/^".+"$/);
    expect(response.headers.get("last-modified")).toBe(
      "Tue, 05 May 2026 09:00:00 GMT"
    );
    expect(body).toContain("BEGIN:VCALENDAR");
    expect(body).toContain("SUMMARY:Board review");
  });

  it("returns 404 for invalid tokens", async () => {
    const data = await import("@/lib/calendar-data");
    vi.mocked(data.getSubscriptionByToken).mockResolvedValue(null);

    const { GET } = await import(
      "@/app/api/feeds/[token]/calendar.ics/route"
    );
    const response = await GET(new Request("https://test.local"), {
      params: Promise.resolve({ token: "missing" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 304 when the etag matches", async () => {
    const { GET } = await import(
      "@/app/api/feeds/[token]/calendar.ics/route"
    );
    const first = await GET(new Request("https://test.local"), {
      params: Promise.resolve({ token: "raw-token" }),
    });
    const etag = first.headers.get("etag");
    const second = await GET(
      new Request("https://test.local", {
        headers: etag ? { "if-none-match": etag } : undefined,
      }),
      {
        params: Promise.resolve({ token: "raw-token" }),
      }
    );

    expect(second.status).toBe(304);
    expect(await second.text()).toBe("");
  });
});
