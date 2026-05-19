import { and, asc, desc, eq, gt, gte, isNull, lt, or, sql } from "drizzle-orm";

import { getDb } from "@/db";
import {
  calendars,
  events,
  subscriptionLinks,
  type Calendar,
  type Event,
  type SubscriptionLink,
} from "@/db/schema";
import { getMonthBounds } from "@/lib/dates";
import { hashToken } from "@/lib/tokens";

export async function listCalendars(includeArchived = false) {
  const db = getDb();

  return db
    .select()
    .from(calendars)
    .where(includeArchived ? undefined : eq(calendars.isArchived, false))
    .orderBy(asc(calendars.isArchived), asc(calendars.name));
}

type SubscriptionWithCalendar = {
  link: SubscriptionLink;
  calendar: Calendar;
};

export async function getCalendar(calendarId: string): Promise<Calendar | null> {
  const db = getDb();
  const [calendar] = await db
    .select()
    .from(calendars)
    .where(eq(calendars.id, calendarId))
    .limit(1);

  return calendar ?? null;
}

export async function getFirstActiveCalendar(): Promise<Calendar | null> {
  const db = getDb();
  const [calendar] = await db
    .select()
    .from(calendars)
    .where(eq(calendars.isArchived, false))
    .orderBy(asc(calendars.createdAt))
    .limit(1);

  return calendar ?? null;
}

export async function getMonthEvents(calendar: Calendar, month: string) {
  const db = getDb();
  const bounds = getMonthBounds(month, calendar.timezone);

  return db
    .select()
    .from(events)
    .where(
      and(
        eq(events.calendarId, calendar.id),
        or(
          and(
            eq(events.kind, "timed"),
            lt(events.startsAt, bounds.endUtc),
            gte(events.endsAt, bounds.startUtc)
          ),
          and(
            eq(events.kind, "all_day"),
            lt(events.allDayStart, bounds.endDateString),
            gt(events.allDayEnd, bounds.startDateString)
          )
        )
      )
    )
    .orderBy(asc(events.allDayStart), asc(events.startsAt), asc(events.title));
}

export async function getEvent(eventId: string): Promise<Event | null> {
  const db = getDb();
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  return event ?? null;
}

export async function getSubscriptionLinks(calendarId: string) {
  const db = getDb();

  return db
    .select()
    .from(subscriptionLinks)
    .where(eq(subscriptionLinks.calendarId, calendarId))
    .orderBy(desc(subscriptionLinks.createdAt));
}

export async function getSubscriptionByToken(
  token: string
): Promise<SubscriptionWithCalendar | null> {
  const db = getDb();
  const tokenHash = hashToken(token);
  const [row] = await db
    .select({
      link: subscriptionLinks,
      calendar: calendars,
    })
    .from(subscriptionLinks)
    .innerJoin(calendars, eq(subscriptionLinks.calendarId, calendars.id))
    .where(
      and(
        eq(subscriptionLinks.tokenHash, tokenHash),
        isNull(subscriptionLinks.revokedAt),
        eq(calendars.isArchived, false)
      )
    )
    .limit(1);

  return row ?? null;
}

export async function getFeedEvents(calendarId: string) {
  const db = getDb();

  return db
    .select()
    .from(events)
    .where(eq(events.calendarId, calendarId))
    .orderBy(asc(events.allDayStart), asc(events.startsAt), asc(events.title));
}

export async function markSubscriptionAccessed(linkId: string) {
  const db = getDb();

  await db
    .update(subscriptionLinks)
    .set({ lastAccessedAt: new Date() })
    .where(eq(subscriptionLinks.id, linkId));
}

export async function touchCalendar(calendarId: string) {
  const db = getDb();

  await db
    .update(calendars)
    .set({ updatedAt: new Date() })
    .where(eq(calendars.id, calendarId));
}

export async function incrementEventSequence(eventId: string) {
  const db = getDb();

  await db
    .update(events)
    .set({
      sequence: sql`${events.sequence} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(events.id, eventId));
}

export function getLastModified(calendar: Calendar, calendarEvents: Event[]) {
  return calendarEvents.reduce((latest, event) => {
    return event.updatedAt > latest ? event.updatedAt : latest;
  }, calendar.updatedAt);
}
