import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/db/schema";

let db: ReturnType<typeof createDb> | null = null;
let client: ReturnType<typeof createClient> | null = null;

function createClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to access calendar data.");
  }

  return postgres(databaseUrl, {
    max: 1,
    prepare: false,
    ssl: "require",
  });
}

function createDb() {
  client = createClient();
  return drizzle(client, { schema });
}

export function getDb() {
  if (!db) {
    db = createDb();
  }

  return db;
}

export async function closeDb() {
  if (!client) {
    return;
  }

  await client.end({ timeout: 5 });
  client = null;
  db = null;
}
