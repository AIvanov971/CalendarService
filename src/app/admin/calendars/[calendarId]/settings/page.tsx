import Link from "next/link";
import {
  ArrowLeftIcon,
  ArchiveIcon,
  CalendarCogIcon,
  Link2OffIcon,
} from "lucide-react";
import { notFound } from "next/navigation";

import {
  archiveCalendarAction,
  revokeSubscriptionLinkAction,
  updateCalendarAction,
} from "@/app/actions";
import { SubmitButton } from "@/components/admin/submit-button";
import { SubscriptionLinkCreator } from "@/components/admin/subscription-link-creator";
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
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getCalendar,
  getSubscriptionLinks,
} from "@/lib/calendar-data";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CalendarSettingsPage({
  params,
}: {
  params: Promise<{ calendarId: string }>;
}) {
  await requireAdmin();
  const { calendarId } = await params;
  const calendar = await getCalendar(calendarId);

  if (!calendar) {
    notFound();
  }

  const links = await getSubscriptionLinks(calendar.id);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <CalendarCogIcon />
            {calendar.name} settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage calendar metadata and read-only subscriber links.
          </p>
        </div>
        <Link
          href={`/admin/calendars/${calendar.id}`}
          className={buttonVariants({ variant: "outline" })}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Back to month
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Calendar details</CardTitle>
            <CardDescription>
              These values affect admin display and the public feed name.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateCalendarAction} className="flex flex-col gap-5">
              <input type="hidden" name="calendarId" value={calendar.id} />
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Name</FieldLabel>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={calendar.name}
                    required
                  />
                </Field>
                <div className="grid grid-cols-[96px_1fr] gap-3">
                  <Field>
                    <FieldLabel htmlFor="color">Color</FieldLabel>
                    <Input
                      id="color"
                      name="color"
                      type="color"
                      defaultValue={calendar.color}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
                    <Input
                      id="timezone"
                      name="timezone"
                      defaultValue={calendar.timezone}
                      required
                    />
                    <FieldDescription>
                      Use an IANA timezone such as Europe/Sofia.
                    </FieldDescription>
                  </Field>
                </div>
              </FieldGroup>
              <SubmitButton>Save calendar</SubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Archive calendar</CardTitle>
            <CardDescription>
              Archived calendars disappear from active feeds and admin defaults.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={archiveCalendarAction}>
              <input type="hidden" name="calendarId" value={calendar.id} />
              <SubmitButton variant="destructive" pendingLabel="Archiving...">
                <ArchiveIcon data-icon="inline-start" />
                Archive calendar
              </SubmitButton>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>New subscriber link</CardTitle>
            <CardDescription>
              Raw tokens are shown only once and stored as SHA-256 hashes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SubscriptionLinkCreator calendarId={calendar.id} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Issued links</CardTitle>
            <CardDescription>
              Revoke a link to immediately block future feed requests.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Label</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last accessed</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-20 text-center text-muted-foreground"
                      >
                        No subscriber links issued yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    links.map((link) => (
                      <TableRow key={link.id}>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{link.label}</span>
                            <span className="font-mono text-xs text-muted-foreground">
                              {link.tokenHash.slice(0, 12)}...
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {link.revokedAt ? (
                            <Badge variant="secondary">Revoked</Badge>
                          ) : (
                            <Badge>Active</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {link.lastAccessedAt
                            ? link.lastAccessedAt.toLocaleString()
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            {link.revokedAt ? null : (
                              <form action={revokeSubscriptionLinkAction}>
                                <input
                                  type="hidden"
                                  name="linkId"
                                  value={link.id}
                                />
                                <input
                                  type="hidden"
                                  name="calendarId"
                                  value={calendar.id}
                                />
                                <SubmitButton
                                  variant="outline"
                                  size="sm"
                                  pendingLabel="Revoking..."
                                >
                                  <Link2OffIcon data-icon="inline-start" />
                                  Revoke
                                </SubmitButton>
                              </form>
                            )}
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
    </div>
  );
}
