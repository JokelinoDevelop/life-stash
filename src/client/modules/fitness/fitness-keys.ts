/** Query keys for Fitness. Every fitness mutation invalidates `fitnessKeys.all`. */
export const fitnessKeys = {
  all: ["fitness"] as const,
  calendar: (from: string, to: string) =>
    ["fitness", "calendar", from, to] as const,
  lastNote: (trainingId: string, before: string) =>
    ["fitness", "last-note", trainingId, before] as const,
  occurrence: (scheduleId: string, originalDate: string) =>
    ["fitness", "occurrence", scheduleId, originalDate] as const,
  overview: ["fitness", "overview"] as const,
  session: (sessionId: string) => ["fitness", "session", sessionId] as const,
  settings: ["fitness", "settings"] as const,
  trainings: (archived: boolean) => ["fitness", "trainings", archived] as const,
  weight: (from: string, to: string) =>
    ["fitness", "weight", from, to] as const,
};
