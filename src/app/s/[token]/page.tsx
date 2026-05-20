import type { ComponentProps, CSSProperties } from "react";
import { format, parse, subDays } from "date-fns";
import {
  CalendarCheck2Icon,
  CalendarPlusIcon,
  Clock3Icon,
  DownloadIcon,
  ExternalLinkIcon,
  LinkIcon,
  LockKeyholeIcon,
  RefreshCcwIcon,
  ShieldCheckIcon,
  SparklesIcon,
  type LucideIcon,
} from "lucide-react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { CopyButton } from "@/components/feed/copy-button";
import type { Event } from "@/db/schema";
import { getFeedEvents, getSubscriptionByToken } from "@/lib/calendar-data";
import {
  formatDateInZone,
  formatDateStringForDisplay,
  formatDateTimeInZone,
  formatTimeInZone,
} from "@/lib/dates";
import { buildFeedUrl, buildWebcalUrl, getBaseUrl } from "@/lib/url";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function isInstagramBrowser(userAgent: string | null) {
  return /\bInstagram\b/i.test(userAgent ?? "");
}

function safeAccentColor(value: string) {
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)
    ? value
    : "#8b5cf6";
}

function inclusiveEndDate(dateString: string) {
  return format(
    subDays(parse(dateString, "yyyy-MM-dd", new Date()), 1),
    "yyyy-MM-dd"
  );
}

function eventSortValue(event: Event) {
  if (event.kind === "all_day") {
    return event.allDayStart
      ? parse(event.allDayStart, "yyyy-MM-dd", new Date()).getTime()
      : 0;
  }

  return event.startsAt?.getTime() ?? 0;
}

function isUpcomingEvent(event: Event, timezone: string) {
  if (event.kind === "all_day") {
    return Boolean(
      event.allDayEnd &&
        event.allDayEnd > formatDateInZone(new Date(), timezone)
    );
  }

  return Boolean(event.endsAt && event.endsAt >= new Date());
}

function eventDateLabel(event: Event, timezone: string) {
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

  return event.startsAt
    ? formatDateTimeInZone(event.startsAt, timezone)
    : "Timed event";
}

function eventTimeLabel(event: Event, timezone: string) {
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

function eventDayNumber(event: Event, timezone: string) {
  if (event.kind === "all_day" && event.allDayStart) {
    return format(parse(event.allDayStart, "yyyy-MM-dd", new Date()), "d");
  }

  return event.startsAt
    ? format(
        parse(
          formatDateInZone(event.startsAt, timezone),
          "yyyy-MM-dd",
          new Date()
        ),
        "d"
      )
    : "--";
}

function ActionLink({
  className,
  detail,
  icon: Icon,
  label,
  tone = "default",
  ...props
}: ComponentProps<"a"> & {
  detail: string;
  icon: LucideIcon;
  label: string;
  tone?: "default" | "primary";
}) {
  return (
    <a
      className={cn(
        "group relative flex min-h-[112px] flex-1 basis-[220px] flex-col justify-between overflow-hidden rounded-lg border p-4 text-left transition duration-200",
        "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/40",
        tone === "primary"
          ? "border-transparent bg-[var(--calendar-accent)] text-white shadow-[0_22px_60px_color-mix(in_oklab,var(--calendar-accent)_28%,transparent)] hover:-translate-y-0.5 hover:shadow-[0_26px_70px_color-mix(in_oklab,var(--calendar-accent)_36%,transparent)]"
          : "border-white/10 bg-white/[0.055] text-white hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.085]",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-lg transition",
          tone === "primary"
            ? "bg-white/18 text-white group-hover:bg-white/24"
            : "bg-white/10 text-white group-hover:bg-white/14"
        )}
      >
        <Icon />
      </span>
      <span className="space-y-1">
        <span className="flex items-center gap-2 text-sm font-semibold">
          {label}
          <ExternalLinkIcon className="size-3.5 opacity-50 transition group-hover:translate-x-0.5 group-hover:opacity-90" />
        </span>
        <span
          className={cn(
            "block text-xs leading-relaxed",
            tone === "primary" ? "text-white/78" : "text-white/54"
          )}
        >
          {detail}
        </span>
      </span>
    </a>
  );
}

export default async function SubscriberPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const headerStore = await headers();
  const subscription = await getSubscriptionByToken(token);

  if (!subscription) {
    notFound();
  }

  const feedEvents = await getFeedEvents(subscription.calendar.id);
  const feedUrl = buildFeedUrl(await getBaseUrl(), token);
  const webcalUrl = buildWebcalUrl(feedUrl);
  const openedInInstagram = isInstagramBrowser(
    headerStore.get("user-agent")
  );
  const googleUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(
    feedUrl
  )}`;
  const outlookUrl = `https://outlook.live.com/calendar/0/addcalendar?url=${encodeURIComponent(
    feedUrl
  )}`;
  const timezone = subscription.calendar.timezone;
  const accentStyle = {
    "--calendar-accent": safeAccentColor(subscription.calendar.color),
  } as CSSProperties;
  const previewEvents = feedEvents
    .filter((event) => isUpcomingEvent(event, timezone))
    .sort((first, second) => eventSortValue(first) - eventSortValue(second))
    .slice(0, 4);

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#050506] text-white"
      style={accentStyle}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#050506_0%,#111315_44%,#070707_100%)]" />
      <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,.11)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.11)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#ffcf5a,var(--calendar-accent),#37d5a4)]" />

      <section className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.045] shadow-[0_35px_120px_rgba(0,0,0,.42)] backdrop-blur-xl">
          <div className="grid lg:grid-cols-[1.06fr_.94fr]">
            <div className="flex min-h-[640px] flex-col justify-between gap-10 p-6 sm:p-8 lg:p-10">
              <div className="space-y-8">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-lg bg-[var(--calendar-accent)] text-white shadow-[0_18px_46px_color-mix(in_oklab,var(--calendar-accent)_34%,transparent)]">
                    <CalendarCheck2Icon />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/44">
                      Calendar Service
                    </p>
                    <p className="truncate text-sm text-white/64">
                      {timezone}
                    </p>
                  </div>
                </div>

                <div className="max-w-2xl space-y-5">
                  <h1 className="text-balance text-4xl font-semibold leading-[1.02] text-white sm:text-5xl lg:text-6xl">
                    {subscription.calendar.name}
                  </h1>
                  <p className="max-w-xl text-pretty text-base leading-7 text-white/66 sm:text-lg">
                    A read-only calendar feed that stays fresh in Apple Calendar,
                    Google Calendar, Outlook, and any app that understands ICS.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-white/10 bg-white/[0.055] p-3">
                    <ShieldCheckIcon className="mb-3 size-4 text-[#37d5a4]" />
                    <p className="text-xs font-medium text-white">Read-only</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/48">
                      Subscription access only
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.055] p-3">
                    <RefreshCcwIcon className="mb-3 size-4 text-[#ffcf5a]" />
                    <p className="text-xs font-medium text-white">Auto-refresh</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/48">
                      Controlled by your app
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.055] p-3">
                    <LockKeyholeIcon className="mb-3 size-4 text-[var(--calendar-accent)]" />
                    <p className="text-xs font-medium text-white">Private link</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/48">
                      Keep it with subscribers
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <aside className="border-t border-white/10 bg-[#f8f3e7] p-4 text-[#121212] lg:border-l lg:border-t-0 lg:p-6">
              <div className="flex min-h-[600px] flex-col rounded-lg border border-black/10 bg-[#fffaf0] shadow-[0_28px_80px_rgba(0,0,0,.25)]">
                <div className="border-b border-black/10 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-black/45">
                        Feed preview
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-normal text-[#111]">
                        Upcoming
                      </h2>
                    </div>
                    <div className="rounded-lg bg-[var(--calendar-accent)] px-3 py-2 text-center text-white">
                      <p className="text-2xl font-semibold leading-none">
                        {previewEvents.length}
                      </p>
                      <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white/72">
                        up next
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-3 p-4">
                  {previewEvents.length > 0 ? (
                    previewEvents.map((event) => (
                      <article
                        key={event.id}
                        className="grid grid-cols-[48px_1fr] gap-3 rounded-lg border border-black/8 bg-white p-3 shadow-sm"
                      >
                        <div className="flex size-12 flex-col items-center justify-center rounded-lg bg-[#111] text-white">
                          <span className="text-lg font-semibold leading-none">
                            {eventDayNumber(event, timezone)}
                          </span>
                          <span className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/50">
                            day
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#111]">
                            {event.title}
                          </p>
                          <p className="mt-1 text-xs text-black/55">
                            {eventDateLabel(event, timezone)}
                          </p>
                          <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-black/[0.045] px-2 py-1 text-[11px] font-medium text-black/58">
                            <Clock3Icon className="size-3" />
                            {eventTimeLabel(event, timezone)}
                          </p>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-black/15 bg-black/[0.025] p-8 text-center">
                      <SparklesIcon className="mb-3 size-6 text-[var(--calendar-accent)]" />
                      <p className="text-sm font-semibold">No upcoming events</p>
                      <p className="mt-1 max-w-52 text-xs leading-relaxed text-black/50">
                        New events will appear here when this calendar is updated.
                      </p>
                    </div>
                  )}
                </div>

                <div className="border-t border-black/10 p-4">
                  <p className="text-xs text-black/46">
                    Last updated{" "}
                    <span className="font-medium text-black/64">
                      {formatDateTimeInZone(
                        subscription.calendar.updatedAt,
                        timezone
                      )}
                    </span>
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-[1.1rem] border border-white/10 bg-white/[0.04] p-4 shadow-[0_22px_70px_rgba(0,0,0,.28)] backdrop-blur-xl sm:p-5">
          {openedInInstagram ? (
            <div className="mb-4 rounded-lg border border-[#ffcf5a]/30 bg-[#ffcf5a]/10 p-3 text-sm text-[#ffe3a0]">
              Instagram can block calendar files and webcal links. Open this
              page in your device browser, or copy the HTTPS link.
            </div>
          ) : null}

          <div className="rounded-lg border border-white/10 bg-black/18 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white/82">
              <LinkIcon />
              Calendar feed URL
            </div>
            <div className="break-all rounded-md border border-white/8 bg-black/28 p-3 font-mono text-xs leading-relaxed text-white/58">
              {feedUrl}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <ActionLink
              href={webcalUrl}
              detail="Best for iPhone, iPad, and macOS"
              icon={CalendarPlusIcon}
              label="Apple Calendar"
              rel="external"
              tone="primary"
            />
            <ActionLink
              href={googleUrl}
              detail="Add by URL in Google Calendar"
              icon={ExternalLinkIcon}
              label="Google Calendar"
              target="_blank"
              rel="noreferrer"
            />
            <ActionLink
              href={outlookUrl}
              detail="Subscribe through Outlook web"
              icon={ExternalLinkIcon}
              label="Outlook"
              target="_blank"
              rel="noreferrer"
            />
            <ActionLink
              href={feedUrl}
              detail="Save the raw calendar file"
              icon={DownloadIcon}
              label="Download .ics"
              download={`${subscription.calendar.slug}.ics`}
              target="_blank"
              rel="noreferrer"
              type="text/calendar"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <CopyButton value={feedUrl} label="Copy HTTPS link" />
            <CopyButton value={webcalUrl} label="Copy webcal link" />
          </div>
        </div>
      </section>
    </main>
  );
}
