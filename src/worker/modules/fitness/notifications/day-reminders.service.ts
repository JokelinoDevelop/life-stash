import type { PushMessage } from "../../../core/push";
import type { CalendarPort } from "../sessions/calendar";
import type { FitnessClockPort } from "../user/clock";
import type { FitnessUserPort } from "../user/user.repository";

const COPY = {
  en: { prefix: "Today", title: "Training today" },
  mk: { prefix: "Денес", title: "Тренинг денес" },
} as const;

/** One morning push listing today's planned trainings (when the user wants them). */
export class DayRemindersService {
  readonly #calendar: CalendarPort;
  readonly #clock: FitnessClockPort;
  readonly #user: Pick<FitnessUserPort, "preferences">;
  readonly #send: (message: PushMessage) => Promise<void>;

  constructor(deps: {
    calendar: CalendarPort;
    clock: FitnessClockPort;
    user: Pick<FitnessUserPort, "preferences">;
    send: (message: PushMessage) => Promise<void>;
  }) {
    this.#calendar = deps.calendar;
    this.#clock = deps.clock;
    this.#user = deps.user;
    this.#send = deps.send;
  }

  /** Returns whether a push went out. */
  async run(): Promise<boolean> {
    const prefs = await this.#user.preferences();

    if (!prefs.fitnessReminders) {
      return false;
    }

    const today = await this.#clock.today();

    const entries = await this.#calendar.entries(today, today, today);
    const planned = entries.filter((entry) => entry.status === "planned");

    if (planned.length === 0) {
      return false;
    }

    const copy = COPY[prefs.locale];

    await this.#send({
      body: `${copy.prefix}: ${planned.map((entry) => entry.name).join(", ")}`,
      tag: `fitness-${today}`,
      title: copy.title,
      url: "/fitness",
    });

    return true;
  }
}
