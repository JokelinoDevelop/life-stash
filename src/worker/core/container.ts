import { createFinancesModule } from "../modules/finances/finances.module";
import type { FinancesModule } from "../modules/finances/finances.module";
import type { Db } from "./db";
import type { Bindings } from "./env";

export interface ContainerDeps {
  db: Db;
  env: Bindings;
  householdId: string;
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

  constructor(deps: ContainerDeps) {
    this.#deps = deps;
  }

  get finances(): FinancesModule {
    this.#finances ??= createFinancesModule(this.#deps);

    return this.#finances;
  }
}
