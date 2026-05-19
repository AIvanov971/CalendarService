import Link from "next/link";
import {
  CalendarPlusIcon,
  DownloadIcon,
  ExternalLinkIcon,
  LinkIcon,
} from "lucide-react";
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

export default async function SubscriberPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const subscription = await getSubscriptionByToken(token);

  if (!subscription) {
    notFound();
  }

  const feedUrl = buildFeedUrl(await getBaseUrl(), token);
  const webcalUrl = buildWebcalUrl(feedUrl);
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
            <Link href={webcalUrl} className={buttonVariants()}>
              <CalendarPlusIcon data-icon="inline-start" />
              Apple Calendar
            </Link>
            <Link
              href={googleUrl}
              target="_blank"
              className={buttonVariants({ variant: "outline" })}
            >
              <ExternalLinkIcon data-icon="inline-start" />
              Google Calendar
            </Link>
            <Link
              href={outlookUrl}
              target="_blank"
              className={buttonVariants({ variant: "outline" })}
            >
              <ExternalLinkIcon data-icon="inline-start" />
              Outlook
            </Link>
            <Link
              href={feedUrl}
              className={buttonVariants({ variant: "secondary" })}
              download
            >
              <DownloadIcon data-icon="inline-start" />
              Download .ics
            </Link>
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
