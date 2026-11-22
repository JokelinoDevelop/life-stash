/** What the Timeline shows; `all` mixes services, expenses and odometer readings. */
export const TIMELINE_FILTERS = [
  "all",
  "services",
  "expenses",
  "odometer",
] as const;

export type TimelineFilter = (typeof TIMELINE_FILTERS)[number];

interface Dated {
  id: string;
  date: string;
}

interface Reading extends Dated {
  source: string;
}

export type TimelineEntry<V, E, R> =
  | { kind: "service"; id: string; date: string; visit: V }
  | { kind: "expense"; id: string; date: string; expense: E }
  | { kind: "reading"; id: string; date: string; reading: R };

/** Same-day entries: services first, then expenses, then readings. */
const KIND_ORDER = { expense: 1, reading: 2, service: 0 } as const;

/**
 * One newest-first list of a car's services, expenses and odometer readings.
 * Only stand-alone readings are included: readings that come from a service or
 * an expense are already shown by that entry.
 */
export const buildTimeline = <
  V extends Dated,
  E extends Dated,
  R extends Reading,
>(
  input: {
    visits: readonly V[];
    expenses: readonly E[];
    readings: readonly R[];
  },
  filter: TimelineFilter
): TimelineEntry<V, E, R>[] => {
  const entries: TimelineEntry<V, E, R>[] = [];

  if (filter === "all" || filter === "services") {
    for (const entry of input.visits) {
      entries.push({
        date: entry.date,
        id: entry.id,
        kind: "service",
        visit: entry,
      });
    }
  }

  if (filter === "all" || filter === "expenses") {
    for (const entry of input.expenses) {
      entries.push({
        date: entry.date,
        expense: entry,
        id: entry.id,
        kind: "expense",
      });
    }
  }

  if (filter === "all" || filter === "odometer") {
    for (const entry of input.readings) {
      if (entry.source === "reading") {
        entries.push({
          date: entry.date,
          id: entry.id,
          kind: "reading",
          reading: entry,
        });
      }
    }
  }

  return entries.toSorted(
    (a, b) =>
      b.date.localeCompare(a.date) || KIND_ORDER[a.kind] - KIND_ORDER[b.kind]
  );
};
