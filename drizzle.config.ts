import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });
config();

const databaseUrl = process.env.DATABASE_URL;
const commandRequiresDatabase = process.argv.some((arg) =>
  ["migrate", "push", "pull", "studio", "introspect"].includes(arg)
);

if (!databaseUrl && commandRequiresDatabase) {
  throw new Error("DATABASE_URL is required to run Drizzle migrations.");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl ?? "",
  },
});
