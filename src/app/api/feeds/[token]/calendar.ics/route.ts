import { createHash } from "node:crypto";

import {
  getFeedEvents,
  getLastModified,
  getSubscriptionByToken,
  markSubscriptionAccessed,
} from "@/lib/calendar-data";
import { buildCalendarIcs } from "@/lib/ical";
import { buildFeedUrl, getBaseUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

function etagFor(value: string) {
  return `"${createHash("sha256").update(value).digest("base64url")}"`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const subscription = await getSubscriptionByToken(token);

  if (!subscription) {
    return new Response("Calendar feed not found.", { status: 404 });
  }

  const feedEvents = await getFeedEvents(subscription.calendar.id);
  const feedUrl = buildFeedUrl(await getBaseUrl(), token);
  const body = buildCalendarIcs({
    calendar: subscription.calendar,
    events: feedEvents,
    feedUrl,
  });
  const etag = etagFor(body);
  const lastModified = getLastModified(
    subscription.calendar,
    feedEvents
  ).toUTCString();

  await markSubscriptionAccessed(subscription.link.id);

  const headers = {
    "Content-Type": "text/calendar; charset=utf-8",
    "Content-Disposition": `attachment; filename="${subscription.calendar.slug}.ics"`,
    "Cache-Control": "public, max-age=60",
    "CDN-Cache-Control": "max-age=300, stale-while-revalidate=300",
    ETag: etag,
    "Last-Modified": lastModified,
  };

  if (
    request.headers.get("if-none-match") === etag ||
    request.headers.get("if-modified-since") === lastModified
  ) {
    return new Response(null, {
      status: 304,
      headers,
    });
  }

  return new Response(body, {
    status: 200,
    headers,
  });
}
