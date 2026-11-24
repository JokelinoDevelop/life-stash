import { createFinancesModule } from "../modules/finances/finances.module";
import type { FinancesModule } from "../modules/finances/finances.module";
import { createFitnessModule } from "../modules/fitness/fitness.module";
import type { FitnessModule } from "../modules/fitness/fitness.module";
import type { Db } from "./db";
import type { Bindings } from "./env";

export interface ContainerDeps {
  db: Db;
  env: Bindings;
  householdId: string;
  /** The signed-in user (per-user modules such as Fitness); crons that work per household leave it out. */
  userId?: string;
  /** Runs work after the response (wraps `executionCtx.waitUntil`); services never touch Hono. */
  defer: (work: Promise<unknown>) => void;
}

/**
 * Per-request composition root. Modules are built lazily on first use, so a request only pays
 * for what it touches. The cron builds one container per household.
 */
export class Container {
  readonly #deps: ContainerDeps;
  #finances: FinancesModule | undefined;
  #fitness: FitnessModule | undefined;

  constructor(deps: ContainerDeps) {
    this.#deps = deps;
  }

  get finances(): FinancesModule {
    this.#finances ??= createFinancesModule(this.#deps);

    return this.#finances;
  }

  /** Fitness is personal: it needs the user, not just the household. */
  get fitness(): FitnessModule {
    const { userId } = this.#deps;

    if (userId === undefined) {
      throw new Error("Fitness needs a user; build the container with userId");
    }

    this.#fitness ??= createFitnessModule({ ...this.#deps, userId });

    return this.#fitness;
  }
}
