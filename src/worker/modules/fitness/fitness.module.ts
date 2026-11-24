import type { ContainerDeps } from "../../core/container";
import { sendPushToUser } from "../../core/push";
import { DayRemindersService } from "./notifications/day-reminders.service";
import { FitnessOverviewService } from "./overview/overview.service";
import { CalendarReader } from "./sessions/calendar";
import { SessionsRepository } from "./sessions/sessions.repository";
import { SessionsService } from "./sessions/sessions.service";
import { FitnessSettingsService } from "./settings/settings.service";
import { SchedulesRepository } from "./trainings/schedules.repository";
import { TrainingsRepository } from "./trainings/trainings.repository";
import { TrainingsService } from "./trainings/trainings.service";
import { FitnessClock } from "./user/clock";
import { FitnessUserRepository } from "./user/user.repository";
import { WeightRepository } from "./weight/weight.repository";
import { WeightService } from "./weight/weight.service";

export interface FitnessModule {
  trainings: TrainingsService;
  sessions: SessionsService;
  weight: WeightService;
  overview: FitnessOverviewService;
  settings: FitnessSettingsService;
  dayReminders: DayRemindersService;
}

// Wiring reads best with matching names; sort-keys and shorthand grouping fight over it here.
// oxlint-disable sonarjs/shorthand-property-grouping

/** Wires the Fitness repositories and services for one user (scoped by household and user). */
export const createFitnessModule = ({
  db,
  env,
  householdId,
  userId,
}: ContainerDeps & { userId: string }): FitnessModule => {
  const user = new FitnessUserRepository(db, householdId, userId);
  const clock = new FitnessClock(user);
  const trainingsRepo = new TrainingsRepository(db, householdId, userId);
  const schedules = new SchedulesRepository(db, householdId, userId);
  const sessionsRepo = new SessionsRepository(db, householdId, userId);
  const weightRepo = new WeightRepository(db, householdId, userId);

  const calendar = new CalendarReader({
    schedules,
    sessions: sessionsRepo,
    trainings: trainingsRepo,
  });

  const trainings = new TrainingsService({
    clock,
    repo: trainingsRepo,
    schedules,
    sessions: sessionsRepo,
  });

  return {
    dayReminders: new DayRemindersService({
      calendar,
      clock,
      send: async (message) => {
        await sendPushToUser(env, db, userId, message);
      },
      user,
    }),
    overview: new FitnessOverviewService({
      calendar,
      clock,
      weight: weightRepo,
    }),
    sessions: new SessionsService({
      calendar,
      clock,
      repo: sessionsRepo,
      schedules,
      trainings,
    }),
    settings: new FitnessSettingsService(user),
    trainings,
    weight: new WeightService({ clock, repo: weightRepo }),
  };
};
