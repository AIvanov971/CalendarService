"use client";

import { useActionState } from "react";
import { LockKeyholeIcon, LogInIcon } from "lucide-react";

import { loginAction, type FormState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const initialState: FormState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="flex flex-col gap-5">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
          <FieldDescription>
            Use the admin account seeded with `npm run db:seed`.
          </FieldDescription>
        </Field>
      </FieldGroup>
      {state.error ? <FieldError>{state.error}</FieldError> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? (
          <LockKeyholeIcon data-icon="inline-start" />
        ) : (
          <LogInIcon data-icon="inline-start" />
        )}
        {pending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
