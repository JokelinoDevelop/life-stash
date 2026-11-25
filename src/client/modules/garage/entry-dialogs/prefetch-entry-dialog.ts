import type { QueryClient } from "@tanstack/react-query";

import { cached, warmDialog } from "@/lib/warm";

import { carQuery } from "../cars/cars.queries";
import { expenseQuery } from "../expenses/expenses.queries";
import { mileageQuery } from "../mileage/mileage.queries";
import { reminderQuery } from "../reminders/reminders.queries";
import { visitQuery } from "../visits/visits.queries";
import type { EntryDialogTarget } from "./entry-dialog-search";

/** Queries each garage dialog's form waits for. */
const loadsFor = (client: QueryClient, target: EntryDialogTarget) => {
  switch (target.dialog) {
    case "car": {
      return target.car === undefined
        ? []
        : [client.query(cached(carQuery(target.car)))];
    }

    case "service": {
      return [
        client.query(cached(mileageQuery(target.car))),
        ...(target.id === undefined
          ? []
          : [client.query(cached(visitQuery(target.id)))]),
        ...(target.reminder === undefined
          ? []
          : [client.query(cached(reminderQuery(target.reminder)))]),
      ];
    }

    case "expense": {
      return [
        ...(target.id === undefined
          ? []
          : [client.query(cached(expenseQuery(target.id)))]),
        ...(target.reminder === undefined
          ? []
          : [client.query(cached(reminderQuery(target.reminder)))]),
      ];
    }

    case "reminder": {
      return target.id === undefined
        ? []
        : [client.query(cached(reminderQuery(target.id)))];
    }

    default: {
      return [];
    }
  }
};

export const prefetchEntryDialog = async (
  client: QueryClient,
  target: EntryDialogTarget
): Promise<void> => {
  await warmDialog(...loadsFor(client, target));
};
