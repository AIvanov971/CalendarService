import Link from "next/link";
import { format, parse, subDays } from "date-fns";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarCogIcon,
  MapPinIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";

import { deleteEventAction } from "@/app/actions";
import { RememberCalendarMonth } from "@/components/admin/remember-calendar-month";
import { SubmitButton } from "@/components/admin/submit-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Calendar, Event } from "@/db/schema";
import {
  formatDateInZone,
  formatDateStringForDisplay,
  formatDateTimeInZone,
  formatTimeInZone,
  getMonthBounds,
  getMonthGrid,
} from "@/lib/dates";
import { cn } from "@/lib/utils";

type MonthViewProps = {
  calendar: Calendar;
  events: Event[];
  month: string;
};

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function inclusiveEndDate(dateString: string) {
  return format(
    subDays(parse(dateString, "yyyy-MM-dd", new Date()), 1),
    "yyyy-MM-dd"
  );
}

function eventStartsOnDay(event: Event, date: string, timezone: string) {
  if (event.kind === "all_day") {
    return Boolean(
      event.allDayStart && event.allDayEnd && event.allDayStart <= date && date < event.allDayEnd
    );
  }

  return Boolean(event.startsAt && formatDateInZone(event.startsAt, timezone) === date);
}

function eventDisplayTime(event: Event, timezone: string) {
  if (event.kind === "all_day") {
    return "All-day";
  }

  if (!event.startsAt || !event.endsAt) {
    return "Timed";
  }

  return `${formatTimeInZone(event.startsAt, timezone)}-${formatTimeInZone(
    event.endsAt,
    timezone
  )}`;
}

function eventDisplayRange(event: Event, timezone: string) {
  if (event.kind === "all_day") {
    if (!event.allDayStart || !event.allDayEnd) {
      return "All-day";
    }

    const end = inclusiveEndDate(event.allDayEnd);

    return event.allDayStart === end
      ? formatDateStringForDisplay(event.allDayStart)
      : `${formatDateStringForDisplay(
          event.allDayStart
        )} to ${formatDateStringForDisplay(end)}`;
  }

  if (!event.startsAt || !event.endsAt) {
    return "Timed";
  }

  return `${formatDateTimeInZone(event.startsAt, timezone)} to ${formatDateTimeInZone(
    event.endsAt,
    timezone
  )}`;
}

export function MonthView({ calendar, events, month }: MonthViewProps) {
  const bounds = getMonthBounds(month, calendar.timezone);
  const grid = getMonthGrid(month);
  const monthTitle = format(bounds.startDate, "MMMM yyyy");

  return (
    <div className="flex flex-col gap-5">
      <RememberCalendarMonth calendarId={calendar.id} month={month} />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span
              className="size-3 rounded-full"
              style={{ backgroundColor: calendar.color }}
            />
            <h1 className="text-2xl font-semibold tracking-normal">
              {calendar.name}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {monthTitle} · {calendar.timezone}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/calendars/${calendar.id}?month=${bounds.previousMonth}`}
            className={buttonVariants({ variant: "outline" })}
          >
            <ArrowLeftIcon data-icon="inline-start" />
            Previous
          </Link>
          <Link
            href={`/admin/calendars/${calendar.id}?month=${bounds.nextMonth}`}
            className={buttonVariants({ variant: "outline" })}
          >
            Next
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
          <Link
            href={`/admin/calendars/${calendar.id}/settings`}
            className={buttonVariants({ variant: "secondary" })}
          >
            <CalendarCogIcon data-icon="inline-start" />
            Settings
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Month schedule</CardTitle>
          <CardDescription>
            Click an event in the list below to edit details, or use the form to
            add a new entry.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 overflow-hidden rounded-lg border">
            {weekDays.map((day) => (
              <div
                key={day}
                className="border-b bg-muted/50 px-2 py-2 text-center text-xs font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
            {grid.map((day) => {
              const dayEvents = events.filter((event) =>
                eventStartsOnDay(event, day.date, calendar.timezone)
              );

              return (
                <div
                  key={day.date}
                  className={cn(
                    "min-h-28 border-b border-r p-2 last:border-r-0",
                    !day.inMonth && "bg-muted/25 text-muted-foreground"
                  )}
                >
                  <div className="mb-2 text-xs font-medium">
                    {day.dayNumber}
                  </div>
                  <div className="flex flex-col gap-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <Link
                        key={event.id}
                        href={`/admin/events/${event.id}/edit?month=${month}`}
                        className="rounded-md border bg-background px-2 py-1 text-xs transition-colors hover:bg-muted"
                      >
                        <span className="block truncate font-medium">
                          {event.title}
                        </span>
                        <span className="block truncate text-muted-foreground">
                          {eventDisplayTime(event, calendar.timezone)}
                        </span>
                      </Link>
                    ))}
                    {dayEvents.length > 3 ? (
                      <span className="text-xs text-muted-foreground">
                        +{dayEvents.length - 3} more
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Events this month</CardTitle>
          <CardDescription>
            {events.length} {events.length === 1 ? "event" : "events"} in this
            calendar window.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-20 text-center text-muted-foreground"
                    >
                      No events for this month yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{event.title}</span>
                          <Badge variant="secondary" className="w-fit">
                            {event.kind === "all_day" ? "All-day" : "Timed"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {eventDisplayRange(event, calendar.timezone)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {event.location ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPinIcon data-icon="inline-start" />
                            {event.location}
                          </span>
                        ) : (
                          "No location"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/admin/events/${event.id}/edit?month=${month}`}
                            className={buttonVariants({
                              variant: "outline",
                              size: "sm",
                            })}
                          >
                            <PencilIcon data-icon="inline-start" />
                            Edit
                          </Link>
                          <form action={deleteEventAction}>
                            <input
                              type="hidden"
                              name="eventId"
                              value={event.id}
                            />
                            <input
                              type="hidden"
                              name="calendarId"
                              value={calendar.id}
                            />
                            <input type="hidden" name="month" value={month} />
                            <SubmitButton
                              variant="destructive"
                              size="sm"
                              pendingLabel="Deleting..."
                            >
                              <Trash2Icon data-icon="inline-start" />
                              Delete
                            </SubmitButton>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
