import Link from "next/link";
import { format, parse, subDays } from "date-fns";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";
import { notFound } from "next/navigation";

import {
  EventForm,
  type EventFormValues,
} from "@/components/admin/event-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { getCalendar, getEvent } from "@/lib/calendar-data";
import { normalizeMonth, toDateTimeLocalValue } from "@/lib/dates";

export const dynamic = "force-dynamic";

function inclusiveEndDate(dateString: string) {
  return format(
    subDays(parse(dateString, "yyyy-MM-dd", new Date()), 1),
    "yyyy-MM-dd"
  );
}

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  await requireAdmin();
  const { eventId } = await params;
  const { month: monthParam } = await searchParams;
  const event = await getEvent(eventId);

  if (!event) {
    notFound();
  }

  const calendar = await getCalendar(event.calendarId);

  if (!calendar) {
    notFound();
  }

  const month = normalizeMonth(monthParam);
  const defaults: EventFormValues = {
    eventId: event.id,
    kind: event.kind,
    title: event.title,
    description: event.description,
    location: event.location,
    startsAt: event.startsAt
      ? toDateTimeLocalValue(event.startsAt, calendar.timezone)
      : undefined,
    endsAt: event.endsAt
      ? toDateTimeLocalValue(event.endsAt, calendar.timezone)
      : undefined,
    allDayStart: event.allDayStart ?? undefined,
    allDayEndInclusive: event.allDayEnd
      ? inclusiveEndDate(event.allDayEnd)
      : undefined,
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <PencilIcon />
            Edit event
          </h1>
          <p className="text-sm text-muted-foreground">{calendar.name}</p>
        </div>
        <Link
          href={`/admin/calendars/${calendar.id}?month=${month}`}
          className={buttonVariants({ variant: "outline" })}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Back to month
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{event.title}</CardTitle>
          <CardDescription>
            Update event details. Subscriber feeds use stable UIDs and increment
            sequence numbers on edits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EventForm
            mode="edit"
            calendarId={calendar.id}
            month={month}
            timezone={calendar.timezone}
            defaults={defaults}
          />
        </CardContent>
      </Card>
    </div>
  );
}
