import { addDays } from "@shared/domain/dates";
import { streakWeeks, weekProgress } from "@shared/domain/fitness/progress";
import type { WeekProgress } from "@shared/domain/fitness/progress";
import { startOfIsoWeek } from "@shared/domain/fitness/schedule";
import { weightChange } from "@shared/domain/fitness/weight";

import type { CalendarPort, NamedCalendarEntry } from "../sessions/calendar";
import type { FitnessClockPort } from "../user/clock";
import type { WeightRepositoryPort } from "../weight/weight.repository";

/** How far back the streak looks. */
const STREAK_WEEKS = 52;

const CHANGE_LOOKBACK_DAYS = 120;

export interface FitnessOverview {
  today: string;
  week: WeekProgress;
  streakWeeks: number;
  todaySessions: NamedCalendarEntry[];
  weight: {
    latest: { date: string; weightGrams: number } | null;
    change7Grams: number | null;
    change30Grams: number | null;
  };
}

/** Everything the Fitness home and Today need, in one read. */
export class FitnessOverviewService {
  readonly #calendar: CalendarPort;
  readonly #weight: Pick<WeightRepositoryPort, "list">;
  readonly #clock: FitnessClockPort;

  constructor(deps: {
    calendar: CalendarPort;
    weight: Pick<WeightRepositoryPort, "list">;
    clock: FitnessClockPort;
  }) {
    this.#calendar = deps.calendar;
    this.#weight = deps.weight;
    this.#clock = deps.clock;
  }

  async get(): Promise<FitnessOverview> {
    const today = await this.#clock.today();
    const monday = startOfIsoWeek(today);

    const [entries, weights] = await Promise.all([
      this.#calendar.entries(
        addDays(monday, -7 * STREAK_WEEKS),
        addDays(monday, 6),
        today
      ),
      this.#weight.list(addDays(today, -CHANGE_LOOKBACK_DAYS), today),
    ]);

    const latest = weights.at(-1);

    return {
      today,
      streakWeeks: streakWeeks(entries, today),
      todaySessions: entries.filter((entry) => entry.date === today),
      week: weekProgress(entries, today),
      weight: {
        change30Grams: weightChange(weights, 30),
        change7Grams: weightChange(weights, 7),
        latest:
          latest === undefined
            ? null
            : { date: latest.date, weightGrams: latest.weightGrams },
      },
    };
  }
}
