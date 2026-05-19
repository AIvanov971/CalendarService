import { CalendarIcon } from "lucide-react";
import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getFirstActiveCalendar } from "@/lib/calendar-data";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const calendar = await getFirstActiveCalendar();

  if (calendar) {
    redirect(`/admin/calendars/${calendar.id}`);
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl items-center">
      <Card>
        <CardHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-muted">
            <CalendarIcon />
          </div>
          <CardTitle>Create your first calendar</CardTitle>
          <CardDescription>
            Use the sidebar form to create a calendar, then add events month by
            month and generate subscriber links.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Subscriber links are generated per calendar and can be revoked from
          calendar settings.
        </CardContent>
      </Card>
    </div>
  );
}
