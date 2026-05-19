# Calendar Service

A Vercel-ready Next.js app for publishing admin-managed, read-only iCalendar feeds.

## Stack

- Next.js 16 App Router
- React 19
- Drizzle ORM
- Postgres-compatible database
- Vitest

## What It Does

- Admins create multiple calendars.
- Admins add timed and all-day events month by month.
- Admins generate and revoke subscriber links per calendar.
- Subscribers open `/s/[token]` and subscribe/download the hosted `.ics` feed.
- Calendar clients poll `/api/feeds/[token]/calendar.ics`.

## Supabase Database

This project is prepared for Supabase project `LunardoStudio`
(`fesfqntbkwplidbkrgwr`).

The application uses server-side Postgres access through `DATABASE_URL`. For
Vercel/serverless runtime, use a Supabase pooler connection string when possible.
For local migrations, the direct connection string also works when your network
supports IPv6:

```bash
postgresql://postgres:[YOUR-SUPABASE-DB-PASSWORD]@db.fesfqntbkwplidbkrgwr.supabase.co:5432/postgres?sslmode=require
```

You can apply the schema in either of these ways:

```bash
npm run db:migrate
```

or, after `npx supabase login`:

```bash
npm run supabase:link
npm run supabase:push
```

## Local Setup

1. Copy `.env.example` to `.env.local`.
2. Set `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Run migrations:

```bash
npm run db:migrate
```

4. Seed or update the admin account:

```bash
npm run db:seed
```

5. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## GitHub Setup

The repository is configured to run CI on pushes to `main` and pull requests. The workflow installs dependencies with `npm ci`, then runs linting, tests, and a production build.

If using the GitHub CLI locally:

```bash
gh auth login
gh repo view
```

## Vercel Setup

Import the GitHub repository into Vercel and keep the default Next.js settings:

- Framework Preset: Next.js
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: leave empty/default

Use the hosted Postgres connection string for `DATABASE_URL`. Add `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in Vercel environment variables for Production and Preview as needed.

After deployment, run migrations and the seed script from a trusted environment with the production `DATABASE_URL`.

The Vercel CLI is optional for Git-based deploys. To link this checkout after installing the CLI:

```bash
vercel login
vercel link --yes --project <project-name-or-id> --scope <team-or-user-scope>
vercel env pull .env.local
```

## Scripts

- `npm run dev` - start local development.
- `npm run build` - production build.
- `npm run lint` - ESLint.
- `npm test` - Vitest suite.
- `npm run db:generate` - create Drizzle migrations from schema changes.
- `npm run db:migrate` - apply migrations.
- `npm run db:seed` - seed/update the admin account.
- `npm run supabase:link` - link the Supabase CLI to `fesfqntbkwplidbkrgwr`.
- `npm run supabase:push` - push Supabase CLI migrations.
