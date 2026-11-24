import type { FitnessOverview } from "../fitness.queries";

/** Trainings still to do today (they count on the Today badge). */
export const plannedToday = (overview: FitnessOverview | undefined): number =>
  overview?.todaySessions.filter((entry) => entry.status === "planned")
    .length ?? 0;
