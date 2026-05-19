"use client";

import { useMemo, useState } from "react";
import { CalendarDaysIcon, ClockIcon, SaveIcon } from "lucide-react";

import { createEventAction, updateEventAction } from "@/app/actions";
import { SubmitButton } from "@/components/admin/submit-button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type EventFormValues = {
  eventId?: string;
  kind: "timed" | "all_day";
  title?: string;
  description?: string | null;
  location?: string | null;
  startsAt?: string;
  endsAt?: string;
  allDayStart?: string;
  allDayEndInclusive?: string;
};

type EventFormProps = {
  calendarId: string;
  month: string;
  timezone: string;
  mode?: "create" | "edit";
  defaults?: EventFormValues;
};

export function EventForm({
  calendarId,
  month,
  timezone,
  mode = "create",
  defaults,
}: EventFormProps) {
  const [kind, setKind] = useState(defaults?.kind ?? "timed");
  const defaultDay = useMemo(() => `${month}-01`, [month]);

  return (
    <form
      action={mode === "edit" ? updateEventAction : createEventAction}
      className="flex flex-col gap-5"
    >
      <input type="hidden" name="calendarId" value={calendarId} />
      <input type="hidden" name="month" value={month} />
      {defaults?.eventId ? (
        <input type="hidden" name="eventId" value={defaults.eventId} />
      ) : null}
      <FieldGroup>
        <Field>
          <FieldLabel>Event type</FieldLabel>
          <input type="hidden" name="kind" value={kind} />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setKind("timed")}
              className={cn(
                "flex h-9 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors",
                kind === "timed"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted"
              )}
            >
              <ClockIcon data-icon="inline-start" />
              Timed
            </button>
            <button
              type="button"
              onClick={() => setKind("all_day")}
              className={cn(
                "flex h-9 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors",
                kind === "all_day"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted"
              )}
            >
              <CalendarDaysIcon data-icon="inline-start" />
              All-day
            </button>
          </div>
        </Field>
        <Field>
          <FieldLabel htmlFor="title">Title</FieldLabel>
          <Input
            id="title"
            name="title"
            defaultValue={defaults?.title}
            maxLength={180}
            required
          />
        </Field>
        {kind === "timed" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="startsAt">Starts</FieldLabel>
              <Input
                id="startsAt"
                name="startsAt"
                type="datetime-local"
                defaultValue={defaults?.startsAt ?? `${defaultDay}T09:00`}
                required={kind === "timed"}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="endsAt">Ends</FieldLabel>
              <Input
                id="endsAt"
                name="endsAt"
                type="datetime-local"
                defaultValue={defaults?.endsAt ?? `${defaultDay}T10:00`}
                required={kind === "timed"}
              />
            </Field>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="allDayStart">Start date</FieldLabel>
              <Input
                id="allDayStart"
                name="allDayStart"
                type="date"
                defaultValue={defaults?.allDayStart ?? defaultDay}
                required={kind === "all_day"}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="allDayEndInclusive">
                End date
              </FieldLabel>
              <Input
                id="allDayEndInclusive"
                name="allDayEndInclusive"
                type="date"
                defaultValue={defaults?.allDayEndInclusive ?? defaultDay}
                required={kind === "all_day"}
              />
            </Field>
          </div>
        )}
        <Field>
          <FieldLabel htmlFor="location">Location</FieldLabel>
          <Input
            id="location"
            name="location"
            defaultValue={defaults?.location ?? ""}
            maxLength={240}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea
            id="description"
            name="description"
            defaultValue={defaults?.description ?? ""}
            rows={4}
          />
          <FieldDescription>
            Times are entered in {timezone}; feeds are stored and emitted safely
            in UTC/date-only form.
          </FieldDescription>
        </Field>
      </FieldGroup>
      <SubmitButton pendingLabel={mode === "edit" ? "Saving..." : "Creating..."}>
        <SaveIcon data-icon="inline-start" />
        {mode === "edit" ? "Save event" : "Create event"}
      </SubmitButton>
    </form>
  );
}
