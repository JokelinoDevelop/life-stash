import { addDays } from "@shared/domain/dates";

import { notFound } from "../../../core/errors";
import type { FitnessClockPort } from "../user/clock";
import type {
  WeightInput,
  WeightRepositoryPort,
  WeightRow,
} from "./weight.repository";

const DEFAULT_RANGE_DAYS = 365;

/** Body weight: one entry per day, in grams. */
export class WeightService {
  readonly #repo: WeightRepositoryPort;
  readonly #clock: FitnessClockPort;

  constructor(deps: { repo: WeightRepositoryPort; clock: FitnessClockPort }) {
    this.#repo = deps.repo;
    this.#clock = deps.clock;
  }

  /** Entries in the range (default: the last year), oldest first. */
  async list(range: { from?: string; to?: string }): Promise<WeightRow[]> {
    const today = await this.#clock.today();
    const to = range.to ?? today;
    const from = range.from ?? addDays(to, -DEFAULT_RANGE_DAYS);

    return await this.#repo.list(from, to);
  }

  async upsert(input: WeightInput): Promise<WeightRow> {
    return await this.#repo.upsert(input);
  }

  async delete(entryId: string): Promise<void> {
    if (!(await this.#repo.findById(entryId))) {
      throw notFound();
    }

    await this.#repo.delete(entryId);
  }
}
