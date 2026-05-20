"use server";

import { addDays, format, parse } from "date-fns";
import { and, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getDb } from "@/db";
import {
  adminUsers,
  calendars,
  events,
  subscriptionLinks,
} from "@/db/schema";
import { createSession, destroySession, requireAdmin } from "@/lib/auth";
import { touchCalendar } from "@/lib/calendar-data";
import { DEFAULT_TIMEZONE, toUtcFromLocalDateTime } from "@/lib/dates";
import { verifyPassword } from "@/lib/password";
import { createRawToken, hashToken } from "@/lib/tokens";
import {
  buildFeedUrl,
  buildSubscriberUrl,
  buildWebcalUrl,
  getBaseUrl,
} from "@/lib/url";

export type FormState = {
  error?: string;
  success?: string;
};

export type CreateLinkState = FormState & {
  feedUrl?: string;
  subscriberUrl?: string;
  webcalUrl?: string;
};

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const calendarSchema = z.object({
  name: z.string().trim().min(1).max(120),
  color: z.string().trim().min(1).max(32).default("#7c3aed"),
  timezone: z.string().trim().min(1).max(80).default(DEFAULT_TIMEZONE),
});

const eventSchema = z.object({
  calendarId: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  kind: z.enum(["timed", "all_day"]),
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().max(2000).optional(),
  location: z.string().trim().max(240).optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  allDayStart: z.string().optional(),
  allDayEndInclusive: z.string().optional(),
});

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

function optionalText(value?: string) {
  return value && value.length > 0 ? value : null;
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);

  return slug || "calendar";
}

async function uniqueSlug(name: string, calendarId?: string) {
  const db = getDb();
  const base = slugify(name);

  for (let suffix = 0; suffix < 100; suffix += 1) {
    const candidate = suffix === 0 ? base : `${base}-${suffix + 1}`;
    const [existing] = await db
      .select({ id: calendars.id })
      .from(calendars)
      .where(eq(calendars.slug, candidate))
      .limit(1);

    if (!existing || existing.id === calendarId) {
      return candidate;
    }
  }

  return `${base}-${Date.now()}`;
}

function addOneDay(dateString: string) {
  return format(
    addDays(parse(dateString, "yyyy-MM-dd", new Date()), 1),
    "yyyy-MM-dd"
  );
}

export async function loginAction(
  _previousState: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formValue(formData, "email"),
    password: formValue(formData, "password"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  try {
    const db = getDb();
    const [admin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, parsed.data.email.toLowerCase()))
      .limit(1);

    if (!admin || !verifyPassword(parsed.data.password, admin.passwordHash)) {
      return { error: "Invalid email or password." };
    }

    await createSession({ id: admin.id, email: admin.email });
  } catch (error) {
    console.error(error);
    return { error: "Login is not available until the database is configured." };
  }

  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function createCalendarAction(formData: FormData) {
  await requireAdmin();
  const parsed = calendarSchema.safeParse({
    name: formValue(formData, "name"),
    color: formValue(formData, "color") || "#7c3aed",
    timezone: formValue(formData, "timezone") || DEFAULT_TIMEZONE,
  });

  if (!parsed.success) {
    redirect("/admin");
  }

  const db = getDb();
  const slug = await uniqueSlug(parsed.data.name);
  const [calendar] = await db
    .insert(calendars)
    .values({ ...parsed.data, slug })
    .returning({ id: calendars.id });

  revalidatePath("/admin");
  redirect(`/admin/calendars/${calendar.id}`);
}

export async function updateCalendarAction(formData: FormData) {
  await requireAdmin();
  const calendarId = formValue(formData, "calendarId");
  const parsed = calendarSchema.safeParse({
    name: formValue(formData, "name"),
    color: formValue(formData, "color") || "#7c3aed",
    timezone: formValue(formData, "timezone") || DEFAULT_TIMEZONE,
  });

  if (!calendarId || !parsed.success) {
    redirect("/admin");
  }

  const db = getDb();
  const slug = await uniqueSlug(parsed.data.name, calendarId);

  await db
    .update(calendars)
    .set({ ...parsed.data, slug, updatedAt: new Date() })
    .where(eq(calendars.id, calendarId));

  revalidatePath("/admin");
  redirect(`/admin/calendars/${calendarId}/settings`);
}

export async function archiveCalendarAction(formData: FormData) {
  await requireAdmin();
  const calendarId = formValue(formData, "calendarId");

  if (!calendarId) {
    redirect("/admin");
  }

  const db = getDb();
  await db
    .update(calendars)
    .set({ isArchived: true, updatedAt: new Date() })
    .where(eq(calendars.id, calendarId));

  revalidatePath("/admin");
  redirect("/admin");
}

export async function createEventAction(formData: FormData) {
  await requireAdmin();
  const parsed = eventSchema.safeParse({
    calendarId: formValue(formData, "calendarId"),
    month: formValue(formData, "month"),
    kind: formValue(formData, "kind"),
    title: formValue(formData, "title"),
    description: formValue(formData, "description"),
    location: formValue(formData, "location"),
    startsAt: formValue(formData, "startsAt"),
    endsAt: formValue(formData, "endsAt"),
    allDayStart: formValue(formData, "allDayStart"),
    allDayEndInclusive: formValue(formData, "allDayEndInclusive"),
  });

  if (!parsed.success) {
    redirect("/admin");
  }

  const db = getDb();
  const [calendar] = await db
    .select()
    .from(calendars)
    .where(eq(calendars.id, parsed.data.calendarId))
    .limit(1);

  if (!calendar) {
    redirect("/admin");
  }

  if (parsed.data.kind === "all_day") {
    const start = parsed.data.allDayStart;
    const endInclusive = parsed.data.allDayEndInclusive || start;

    if (!start || !endInclusive || endInclusive < start) {
      redirect(`/admin/calendars/${calendar.id}?month=${parsed.data.month}`);
    }

    await db.insert(events).values({
      calendarId: calendar.id,
      kind: "all_day",
      title: parsed.data.title,
      description: optionalText(parsed.data.description),
      location: optionalText(parsed.data.location),
      allDayStart: start,
      allDayEnd: addOneDay(endInclusive),
      timezone: calendar.timezone,
    });
  } else {
    if (!parsed.data.startsAt || !parsed.data.endsAt) {
      redirect(`/admin/calendars/${calendar.id}?month=${parsed.data.month}`);
    }

    const startsAt = toUtcFromLocalDateTime(
      parsed.data.startsAt,
      calendar.timezone
    );
    const endsAt = toUtcFromLocalDateTime(parsed.data.endsAt, calendar.timezone);

    if (endsAt <= startsAt) {
      redirect(`/admin/calendars/${calendar.id}?month=${parsed.data.month}`);
    }

    await db.insert(events).values({
      calendarId: calendar.id,
      kind: "timed",
      title: parsed.data.title,
      description: optionalText(parsed.data.description),
      location: optionalText(parsed.data.location),
      startsAt,
      endsAt,
      timezone: calendar.timezone,
    });
  }

  await touchCalendar(calendar.id);
  revalidatePath(`/admin/calendars/${calendar.id}`);
  redirect(`/admin/calendars/${calendar.id}?month=${parsed.data.month}`);
}

export async function updateEventAction(formData: FormData) {
  await requireAdmin();
  const eventId = formValue(formData, "eventId");
  const parsed = eventSchema.safeParse({
    calendarId: formValue(formData, "calendarId"),
    month: formValue(formData, "month"),
    kind: formValue(formData, "kind"),
    title: formValue(formData, "title"),
    description: formValue(formData, "description"),
    location: formValue(formData, "location"),
    startsAt: formValue(formData, "startsAt"),
    endsAt: formValue(formData, "endsAt"),
    allDayStart: formValue(formData, "allDayStart"),
    allDayEndInclusive: formValue(formData, "allDayEndInclusive"),
  });

  if (!eventId || !parsed.success) {
    redirect("/admin");
  }

  const db = getDb();
  const [calendar] = await db
    .select()
    .from(calendars)
    .where(eq(calendars.id, parsed.data.calendarId))
    .limit(1);

  if (!calendar) {
    redirect("/admin");
  }

  const common = {
    title: parsed.data.title,
    description: optionalText(parsed.data.description),
    location: optionalText(parsed.data.location),
    timezone: calendar.timezone,
    updatedAt: new Date(),
  };

  if (parsed.data.kind === "all_day") {
    const start = parsed.data.allDayStart;
    const endInclusive = parsed.data.allDayEndInclusive || start;

    if (!start || !endInclusive || endInclusive < start) {
      redirect(`/admin/events/${eventId}/edit`);
    }

    await db
      .update(events)
      .set({
        ...common,
        kind: "all_day",
        startsAt: null,
        endsAt: null,
        allDayStart: start,
        allDayEnd: addOneDay(endInclusive),
        sequence: sql`${events.sequence} + 1`,
      })
      .where(and(eq(events.id, eventId), eq(events.calendarId, calendar.id)));
  } else {
    if (!parsed.data.startsAt || !parsed.data.endsAt) {
      redirect(`/admin/events/${eventId}/edit`);
    }

    const startsAt = toUtcFromLocalDateTime(
      parsed.data.startsAt,
      calendar.timezone
    );
    const endsAt = toUtcFromLocalDateTime(parsed.data.endsAt, calendar.timezone);

    if (endsAt <= startsAt) {
      redirect(`/admin/events/${eventId}/edit`);
    }

    await db
      .update(events)
      .set({
        ...common,
        kind: "timed",
        startsAt,
        endsAt,
        allDayStart: null,
        allDayEnd: null,
        sequence: sql`${events.sequence} + 1`,
      })
      .where(and(eq(events.id, eventId), eq(events.calendarId, calendar.id)));
  }

  await touchCalendar(calendar.id);
  revalidatePath(`/admin/calendars/${calendar.id}`);
  redirect(`/admin/calendars/${calendar.id}?month=${parsed.data.month}`);
}

export async function deleteEventAction(formData: FormData) {
  await requireAdmin();
  const eventId = formValue(formData, "eventId");
  const calendarId = formValue(formData, "calendarId");
  const month = formValue(formData, "month");

  if (!eventId || !calendarId || !month) {
    redirect("/admin");
  }

  const db = getDb();
  await db
    .delete(events)
    .where(and(eq(events.id, eventId), eq(events.calendarId, calendarId)));
  await touchCalendar(calendarId);

  revalidatePath(`/admin/calendars/${calendarId}`);
  redirect(`/admin/calendars/${calendarId}?month=${month}`);
}

export async function createSubscriptionLinkAction(
  _previousState: CreateLinkState,
  formData: FormData
): Promise<CreateLinkState> {
  await requireAdmin();
  const calendarId = formValue(formData, "calendarId");
  const label = formValue(formData, "label")?.trim() || "Subscriber link";

  if (!calendarId) {
    return { error: "Missing calendar." };
  }

  const db = getDb();
  const token = createRawToken();

  await db.insert(subscriptionLinks).values({
    calendarId,
    label,
    tokenHash: hashToken(token),
  });

  await touchCalendar(calendarId);
  revalidatePath(`/admin/calendars/${calendarId}/settings`);

  const baseUrl = await getBaseUrl();
  const feedUrl = buildFeedUrl(baseUrl, token);

  return {
    success: "Subscription link created. Copy it now; the raw token is not stored.",
    feedUrl,
    subscriberUrl: buildSubscriberUrl(baseUrl, token),
    webcalUrl: buildWebcalUrl(feedUrl),
  };
}

export async function revokeSubscriptionLinkAction(formData: FormData) {
  await requireAdmin();
  const linkId = formValue(formData, "linkId");
  const calendarId = formValue(formData, "calendarId");

  if (!linkId || !calendarId) {
    redirect("/admin");
  }

  const db = getDb();

  await db
    .update(subscriptionLinks)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(subscriptionLinks.id, linkId),
        eq(subscriptionLinks.calendarId, calendarId),
        isNull(subscriptionLinks.revokedAt)
      )
    );

  await touchCalendar(calendarId);
  revalidatePath(`/admin/calendars/${calendarId}/settings`);
}
