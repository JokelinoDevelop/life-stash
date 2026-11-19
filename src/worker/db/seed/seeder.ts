import type { SeedContext } from "./context";

/** What a seeder wrote, e.g. `{ visits: 24, lines: 71 }`. Printed in the summary. */
export type SeedCounts = Record<string, number>;

/**
 * One step of the seed. Seeders run in the order they are listed in `seeders.ts` and may read
 * whatever earlier seeders put on the context.
 */
export interface Seeder {
  name: string;
  run: (ctx: SeedContext) => Promise<SeedCounts>;
}

export interface SeederResult {
  name: string;
  counts: SeedCounts;
}

export const runSeeders = async (
  seeders: readonly Seeder[],
  ctx: SeedContext,
  onDone: (result: SeederResult) => void
): Promise<void> => {
  for (const seeder of seeders) {
    // Seeders depend on each other's output, so they run one after another.
    // oxlint-disable-next-line no-await-in-loop, react-doctor/async-await-in-loop
    const counts = await seeder.run(ctx);
    onDone({ counts, name: seeder.name });
  }
};
