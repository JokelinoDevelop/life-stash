import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: [
    "./src/worker/db/schema/core.ts",
    "./src/worker/db/schema/garage.ts",
    "./src/worker/db/schema/finances.ts",
  ],
  out: "./migrations",
});
