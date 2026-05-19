import { config } from "dotenv";
import { eq } from "drizzle-orm";

import { closeDb, getDb } from "../src/db";
import { adminUsers } from "../src/db/schema";
import { hashPassword } from "../src/lib/password";

config({ path: ".env.local" });
config();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required.");
  }

  const db = getDb();
  const passwordHash = hashPassword(password);
  const [existing] = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.email, email.toLowerCase()))
    .limit(1);

  if (existing) {
    await db
      .update(adminUsers)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(adminUsers.id, existing.id));
    console.log(`Updated admin user ${email}.`);
    return;
  }

  await db.insert(adminUsers).values({
    email: email.toLowerCase(),
    passwordHash,
  });
  console.log(`Created admin user ${email}.`);
}

async function run() {
  try {
    await main();
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await closeDb();
  }
}

run();
