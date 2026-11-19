import { todayInTimeZone } from "@shared/domain/dates";

import type { HouseholdRepository } from "./household.repository";

/** "Today" in the household's time zone (overdue is decided by the user's calendar, not UTC). */
export class FinanceClock {
  readonly #household: Pick<HouseholdRepository, "preferences">;
  readonly #now: () => Date;

  constructor(
    household: Pick<HouseholdRepository, "preferences">,
    now: () => Date = () => new Date()
  ) {
    this.#household = household;
    this.#now = now;
  }

  now(): Date {
    return this.#now();
  }

  async today(): Promise<string> {
    const { timeZone } = await this.#household.preferences();

    return todayInTimeZone(timeZone, this.#now());
  }
}

export type ClockPort = Pick<FinanceClock, "now" | "today">;
