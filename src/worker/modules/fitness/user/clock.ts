import { todayInTimeZone } from "@shared/domain/dates";

import type { FitnessUserPort } from "./user.repository";

/** "Today" in the user's own time zone (missed sessions follow their calendar). */
export class FitnessClock {
  readonly #user: Pick<FitnessUserPort, "preferences">;
  readonly #now: () => Date;

  constructor(
    user: Pick<FitnessUserPort, "preferences">,
    now: () => Date = () => new Date()
  ) {
    this.#user = user;
    this.#now = now;
  }

  async today(): Promise<string> {
    const { timeZone } = await this.#user.preferences();

    return todayInTimeZone(timeZone, this.#now());
  }
}

export type FitnessClockPort = Pick<FitnessClock, "today">;
