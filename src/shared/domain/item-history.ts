import type { DatePrecision } from "./dates";

export interface DoneItem {
  itemId: string;
  label: string;
  visitId: string;
  date: string;
  datePrecision: DatePrecision;
  odometerKm: number | null;
  byPreviousOwner: boolean;
}

export interface LastDone extends DoneItem {
  timesDone: number;
}

const isNewer = (candidate: DoneItem, current: DoneItem): boolean => {
  if (candidate.date !== current.date) {
    return candidate.date > current.date;
  }

  return (candidate.odometerKm ?? -1) > (current.odometerKm ?? -1);
};

/** The most recent time each catalog item was done, most recent first. */
export const lastDonePerItem = (entries: readonly DoneItem[]): LastDone[] => {
  const latest = new Map<string, LastDone>();

  for (const entry of entries) {
    const current = latest.get(entry.itemId);

    if (current) {
      const timesDone = current.timesDone + 1;
      latest.set(
        entry.itemId,
        isNewer(entry, current)
          ? { ...entry, timesDone }
          : { ...current, timesDone }
      );
    } else {
      latest.set(entry.itemId, { ...entry, timesDone: 1 });
    }
  }

  return [...latest.values()].toSorted(
    (a, b) => b.date.localeCompare(a.date) || a.label.localeCompare(b.label)
  );
};
