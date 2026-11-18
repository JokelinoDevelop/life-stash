#!/usr/bin/env node
/**
 * Local development only: creates a user + session in the LOCAL D1 database and prints a cookie
 * you can paste into the browser, because passkeys can't be created in some embedded browsers.
 * It refuses to touch the remote database.
 *
 *   node scripts/dev-login.mjs            # creates a dev user if none exists, prints the cookie
 */
import { execFileSync } from "node:child_process";
import { createHash, randomBytes, randomUUID } from "node:crypto";

const run = (sql) =>
  execFileSync(
    "pnpm",
    [
      "exec",
      "wrangler",
      "d1",
      "execute",
      "lifestash",
      "--local",
      "--json",
      "--command",
      sql,
    ],
    {
      encoding: "utf-8",
    }
  );

const query = (sql) => JSON.parse(run(sql))[0]?.results ?? [];

const [existing] = query("SELECT id FROM users ORDER BY created_at LIMIT 1;");
let userId = existing?.id;

if (!userId) {
  const householdId = randomUUID();
  userId = randomUUID();
  const now = new Date().toISOString();
  run(
    [
      `INSERT INTO households (id, name, created_at) VALUES ('${householdId}', 'Home', '${now}');`,
      `INSERT INTO users (id, household_id, display_name, created_at) VALUES ('${userId}', '${householdId}', 'Dev', '${now}');`,
      `INSERT INTO user_preferences (user_id) VALUES ('${userId}');`,
    ].join(" ")
  );
  console.log(
    "Created dev user (note: no catalog seed; add items on the catalog page)."
  );
}

const token = randomBytes(32).toString("base64url");
const sessionId = createHash("sha256").update(token).digest("hex");
const expires = new Date(Date.now() + 90 * 86_400_000).toISOString();

run(
  `INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES ('${sessionId}', '${userId}', '${expires}', '${new Date().toISOString()}');`
);

console.log("\nRun this in the browser console on http://localhost:5173 :\n");

console.log(
  `document.cookie = "ls_session=${token}; path=/"; location.reload();\n`
);
