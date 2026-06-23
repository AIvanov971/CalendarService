import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { EventForm } from "@/components/admin/event-form";
import { MonthView } from "@/components/admin/month-view";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { getCalendar, getMonthEvents } from "@/lib/calendar-data";
import { normalizeMonth } from "@/lib/dates";
import { lastOpenedMonthCookieName } from "@/lib/month-preferences";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ calendarId: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  await requireAdmin();
  const { calendarId } = await params;
  const { month: monthParam } = await searchParams;
  const calendar = await getCalendar(calendarId);

  if (!calendar) {
    notFound();
  }

  const cookieStore = await cookies();
  const rememberedMonth = cookieStore.get(
    lastOpenedMonthCookieName(calendar.id)
  )?.value;
  const month = normalizeMonth(monthParam ?? rememberedMonth);
  const monthEvents = await getMonthEvents(calendar, month);

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <MonthView calendar={calendar} events={monthEvents} month={month} />
      <Card className="h-fit xl:sticky xl:top-6">
        <CardHeader>
          <CardTitle>Create event</CardTitle>
          <CardDescription>
            Add a timed or all-day event to this calendar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EventForm
            calendarId={calendar.id}
            month={month}
            timezone={calendar.timezone}
          />
        </CardContent>
      </Card>
    </div>
  );
}
