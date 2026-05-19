import ical, {
  ICalCalendarMethod,
  ICalEventStatus,
  type ICalEventData,
} from "ical-generator";

import type { Calendar, Event } from "@/db/schema";

type FeedInput = {
  calendar: Calendar;
  events: Event[];
  feedUrl?: string;
};

function allDayDate(dateString: string) {
  return new Date(`${dateString}T00:00:00.000Z`);
}

function toEventData(event: Event): ICalEventData {
  const base = {
    id: `${event.id}@calendar-service`,
    summary: event.title,
    description: event.description || undefined,
    location: event.location || undefined,
    created: event.createdAt,
    lastModified: event.updatedAt,
    stamp: event.updatedAt,
    sequence: event.sequence,
    status: ICalEventStatus.CONFIRMED,
  } satisfies Partial<ICalEventData>;

  if (event.kind === "all_day") {
    if (!event.allDayStart || !event.allDayEnd) {
      throw new Error(`All-day event ${event.id} is missing date boundaries.`);
    }

    return {
      ...base,
      start: allDayDate(event.allDayStart),
      end: allDayDate(event.allDayEnd),
      allDay: true,
    };
  }

  if (!event.startsAt || !event.endsAt) {
    throw new Error(`Timed event ${event.id} is missing time boundaries.`);
  }

  return {
    ...base,
    start: event.startsAt,
    end: event.endsAt,
    timezone: null,
  };
}

export function buildCalendarIcs({ calendar, events, feedUrl }: FeedInput) {
  const feed = ical({
    name: calendar.name,
    prodId: {
      company: "CalendarService",
      product: "Calendar Subscription App",
      language: "EN",
    },
    method: ICalCalendarMethod.PUBLISH,
  });

  feed.description(`Subscription feed for ${calendar.name}`);

  if (feedUrl) {
    feed.url(feedUrl);
  }

  for (const event of events) {
    feed.createEvent(toEventData(event));
  }

  return feed.toString();
}
