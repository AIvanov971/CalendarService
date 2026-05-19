"use client";

import { useActionState } from "react";
import { LinkIcon, PlusIcon } from "lucide-react";

import {
  createSubscriptionLinkAction,
  type CreateLinkState,
} from "@/app/actions";
import { CopyButton } from "@/components/feed/copy-button";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const initialState: CreateLinkState = {};

export function SubscriptionLinkCreator({
  calendarId,
}: {
  calendarId: string;
}) {
  const [state, action, pending] = useActionState(
    createSubscriptionLinkAction,
    initialState
  );

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="calendarId" value={calendarId} />
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="label">Link label</FieldLabel>
            <Input
              id="label"
              name="label"
              placeholder="Board members, Team A, public website"
            />
            <FieldDescription>
              Labels are only visible to admins.
            </FieldDescription>
          </Field>
        </FieldGroup>
        {state.error ? <FieldError>{state.error}</FieldError> : null}
        <Button type="submit" disabled={pending}>
          {pending ? (
            <LinkIcon data-icon="inline-start" />
          ) : (
            <PlusIcon data-icon="inline-start" />
          )}
          {pending ? "Creating..." : "Generate subscriber link"}
        </Button>
      </form>
      {state.feedUrl ? (
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/35 p-3">
          <p className="text-sm font-medium">{state.success}</p>
          <div className="break-all rounded-md bg-background p-3 font-mono text-xs text-muted-foreground">
            {state.feedUrl}
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyButton value={state.feedUrl} label="Copy HTTPS link" />
            {state.webcalUrl ? (
              <CopyButton value={state.webcalUrl} label="Copy webcal link" />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
