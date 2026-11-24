import type { FitnessUserPort } from "../user/user.repository";

/** Fitness settings live on the user's preferences (they are personal). */
export class FitnessSettingsService {
  readonly #user: FitnessUserPort;

  constructor(user: FitnessUserPort) {
    this.#user = user;
  }

  async get(): Promise<{ reminders: boolean }> {
    const prefs = await this.#user.preferences();

    return { reminders: prefs.fitnessReminders };
  }

  async update(input: { reminders: boolean }): Promise<void> {
    await this.#user.setReminders(input.reminders);
  }
}
