import { addDays } from "@shared/domain/dates";
import type { QueryClient } from "@tanstack/react-query";

import { todayIso } from "@/lib/partial-date";
import { cached, warmDialog } from "@/lib/warm";

import {
  occurrenceQuery,
  sessionQuery,
  trainingsQuery,
  weightQuery,
} from "../fitness.queries";
import { PREFILL_DAYS } from "../weight/weight-dialog";
import type { FitnessDialogTarget } from "./fitness-dialog-search";

/** Queries each Fitness dialog's form waits for. */
const loadsFor = (client: QueryClient, target: FitnessDialogTarget) => {
  switch (target.dialog) {
    case "training": {
      return target.id === undefined
        ? []
        : [client.query(cached(trainingsQuery(true)))];
    }

    case "session": {
      const loads: Promise<unknown>[] = [
        client.query(cached(trainingsQuery(true))),
      ];

      if (target.id !== undefined) {
        loads.push(client.query(cached(sessionQuery(target.id))));
      } else if (target.schedule !== undefined && target.date !== undefined) {
        loads.push(
          client.query(cached(occurrenceQuery(target.schedule, target.date)))
        );
      }

      return loads;
    }

    case "weight": {
      const day = target.date ?? todayIso();

      return [
        client.query(cached(weightQuery(addDays(day, -PREFILL_DAYS), day))),
      ];
    }

    default: {
      return [];
    }
  }
};

export const prefetchFitnessDialog = async (
  client: QueryClient,
  target: FitnessDialogTarget
): Promise<void> => {
  await warmDialog(...loadsFor(client, target));
};
