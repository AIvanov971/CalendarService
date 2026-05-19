import Link from "next/link";
import {
  CalendarClockIcon,
  LogOutIcon,
  PlusIcon,
} from "lucide-react";

import { createCalendarAction, logoutAction } from "@/app/actions";
import { SubmitButton } from "@/components/admin/submit-button";
import { Badge } from "@/components/ui/badge";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth";
import { DEFAULT_TIMEZONE } from "@/lib/dates";
import { listCalendars } from "@/lib/calendar-data";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  let calendarList: Awaited<ReturnType<typeof listCalendars>> = [];
  let setupError: string | null = null;

  try {
    calendarList = await listCalendars(true);
  } catch {
    setupError = "Connect DATABASE_URL, run migrations, and seed the admin account.";
  }

  if (setupError) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-5 px-4 py-10">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CalendarClockIcon />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Setup required</h1>
            <p className="text-sm text-muted-foreground">{setupError}</p>
          </div>
        </div>
        <form action={logoutAction}>
          <SubmitButton variant="outline">Sign out</SubmitButton>
        </form>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-b bg-muted/20 lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col gap-6 p-4">
            <div className="flex items-center justify-between gap-3">
              <Link href="/admin" className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <CalendarClockIcon />
                </div>
                <div>
                  <div className="font-semibold">Calendar Service</div>
                  <div className="text-xs text-muted-foreground">
                    {session.email}
                  </div>
                </div>
              </Link>
              <form action={logoutAction}>
                <SubmitButton variant="ghost" size="icon-sm" pendingLabel="">
                  <LogOutIcon />
                  <span className="sr-only">Sign out</span>
                </SubmitButton>
              </form>
            </div>

            <nav className="flex flex-col gap-1">
              <div className="mb-1 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Calendars
              </div>
              {calendarList.map((calendar) => (
                <Link
                  key={calendar.id}
                  href={`/admin/calendars/${calendar.id}`}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted",
                    calendar.isArchived && "text-muted-foreground"
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: calendar.color }}
                    />
                    <span className="truncate">{calendar.name}</span>
                  </span>
                  {calendar.isArchived ? (
                    <Badge variant="secondary">Archived</Badge>
                  ) : null}
                </Link>
              ))}
              {calendarList.length === 0 ? (
                <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                  No calendars yet.
                </div>
              ) : null}
            </nav>

            <form action={createCalendarAction} className="flex flex-col gap-3">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="calendarName">New calendar</FieldLabel>
                  <Input
                    id="calendarName"
                    name="name"
                    placeholder="School schedule"
                    required
                  />
                </Field>
                <div className="grid grid-cols-[88px_1fr] gap-2">
                  <Field>
                    <FieldLabel htmlFor="calendarColor">Color</FieldLabel>
                    <Input
                      id="calendarColor"
                      name="color"
                      type="color"
                      defaultValue="#7c3aed"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
                    <Input
                      id="timezone"
                      name="timezone"
                      defaultValue={DEFAULT_TIMEZONE}
                      required
                    />
                  </Field>
                </div>
              </FieldGroup>
              <SubmitButton size="sm" pendingLabel="Creating...">
                <PlusIcon data-icon="inline-start" />
                Create calendar
              </SubmitButton>
            </form>
          </div>
        </aside>
        <main className="min-w-0 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
