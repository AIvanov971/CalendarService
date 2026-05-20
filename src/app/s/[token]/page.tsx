import {
  CalendarPlusIcon,
  DownloadIcon,
  ExternalLinkIcon,
  LinkIcon,
} from "lucide-react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { CopyButton } from "@/components/feed/copy-button";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSubscriptionByToken } from "@/lib/calendar-data";
import { buildFeedUrl, buildWebcalUrl, getBaseUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

function isInstagramBrowser(userAgent: string | null) {
  return /\bInstagram\b/i.test(userAgent ?? "");
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

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CalendarPlusIcon />
          </div>
          <CardTitle>{subscription.calendar.name}</CardTitle>
          <CardDescription>
            Subscribe once, then your calendar app will periodically refresh
            this read-only feed.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {openedInInstagram ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              Instagram can block calendar files and webcal links. Open this
              page in your device browser, or copy the HTTPS link.
            </div>
          ) : null}

          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <LinkIcon />
              Calendar feed URL
            </div>
            <div className="break-all rounded-md bg-background p-3 font-mono text-xs text-muted-foreground">
              {feedUrl}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={webcalUrl}
              className={buttonVariants()}
              rel="external"
            >
              <CalendarPlusIcon data-icon="inline-start" />
              Apple Calendar
            </a>
            <a
              href={googleUrl}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "outline" })}
            >
              <ExternalLinkIcon data-icon="inline-start" />
              Google Calendar
            </a>
            <a
              href={outlookUrl}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "outline" })}
            >
              <ExternalLinkIcon data-icon="inline-start" />
              Outlook
            </a>
            <a
              href={feedUrl}
              className={buttonVariants({ variant: "secondary" })}
              download={`${subscription.calendar.slug}.ics`}
              target="_blank"
              rel="noreferrer"
              type="text/calendar"
            >
              <DownloadIcon data-icon="inline-start" />
              Download .ics
            </a>
          </div>

          <div className="flex flex-wrap gap-2">
            <CopyButton value={feedUrl} label="Copy HTTPS link" />
            <CopyButton value={webcalUrl} label="Copy webcal link" />
          </div>

          <p className="text-sm text-muted-foreground">
            Calendar apps control refresh frequency. Apple Calendar usually
            lets users choose refresh cadence; Google and Outlook can take
            longer to show updates.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
