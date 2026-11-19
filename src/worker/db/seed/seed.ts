/**
 * Fills the local D1 database with a demo household for development.
 *
 *   pnpm db:seed            replace the demo household, keep everything else
 *   pnpm db:seed --fresh    wipe the whole local database first
 *   pnpm db:seed --seed 7   a different (but still reproducible) random variation
 *
 * It only ever talks to the local database that `pnpm dev` uses (`.wrangler/state`).
 */
import { parseArgs } from "node:util";

import { todayInTimeZone } from "@shared/domain/dates";
import { getPlatformProxy } from "wrangler";

import { createDb } from "../../core/db";
import type { Db } from "../../core/db";
import { CatalogRefs } from "./context";
import type { SeedContext } from "./context";
import { DEMO_ACCOUNT } from "./fixtures/account";
import { createRandom } from "./random";
import type { SeederResult } from "./seeder";
import { runSeeders } from "./seeder";
import { SEEDERS } from "./seeders";
import { createDemoAccount, wipeAllData } from "./seeders/account";

const DEFAULT_SEED = 42;
const NAME_COLUMN_WIDTH = 13;

const { values: args } = parseArgs({
  options: {
    fresh: { default: false, type: "boolean" },
    help: { default: false, short: "h", type: "boolean" },
    seed: { default: String(DEFAULT_SEED), type: "string" },
  },
});

const print = (line = "") => {
  process.stdout.write(`${line}\n`);
};

const printResult = ({ name, counts }: SeederResult) => {
  const summary = Object.entries(counts)
    .map(([what, count]) => `${count} ${what}`)
    .join(" · ");

  print(`  ✓ ${name.padEnd(NAME_COLUMN_WIDTH)}${summary}`);
};

const seed = async (db: Db) => {
  const today = todayInTimeZone(DEMO_ACCOUNT.timeZone);
  print(`Seeding local D1 · today ${today} · seed ${args.seed}`);

  if (args.fresh) {
    await wipeAllData(db);
    print("  ✓ wiped all data");
  }

  const ctx: SeedContext = {
    cars: [],
    catalog: new CatalogRefs(),
    householdId: await createDemoAccount(db),
    random: createRandom(Number(args.seed)),
    db,
    today,
  };

  print(`  ✓ ${"account".padEnd(NAME_COLUMN_WIDTH)}${DEMO_ACCOUNT.email}`);
  await runSeeders(SEEDERS, ctx, printResult);

  print();
  print(`Sign in with ${DEMO_ACCOUNT.email} / ${DEMO_ACCOUNT.password}`);
};

const main = async () => {
  if (args.help) {
    print("Usage: pnpm db:seed [--fresh] [--seed <number>]");

    return;
  }

  const proxy = await getPlatformProxy<{ DB: D1Database }>();

  try {
    await seed(createDb(proxy.env.DB));
  } catch (error) {
    if (error instanceof Error && error.message.includes("no such table")) {
      console.error(
        "\nThe local database has no tables yet. Run `pnpm db:migrate:local` first."
      );
    }

    throw error;
  } finally {
    await proxy.dispose();
  }
};

await main();
