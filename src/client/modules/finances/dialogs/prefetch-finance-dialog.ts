import type { QueryClient } from "@tanstack/react-query";

import { todayIso } from "@/lib/partial-date";
import { cached, warmDialog } from "@/lib/warm";

import { businessProfileQuery } from "../business-profile/business-profile.queries";
import { categoriesQuery } from "../categories/categories.queries";
import { clientQuery, clientsQuery } from "../clients/clients.queries";
import { invoiceQuery } from "../invoices/invoices.queries";
import { projectsQuery } from "../projects/projects.queries";
import { recurringQuery } from "../recurring/recurring.queries";
import { financeSettingsQuery } from "../settings/finance-settings.queries";
import { transactionQuery } from "../transactions/transactions.queries";
import type { FinanceDialogTarget } from "./finance-dialog-search";

/** Queries each Finances dialog's form waits for. */
const loadsFor = (client: QueryClient, target: FinanceDialogTarget) => {
  const year = Number(todayIso().slice(0, 4));

  switch (target.dialog) {
    case "transaction": {
      return [
        client.query(cached(categoriesQuery)),
        client.query(cached(clientsQuery(year))),
        ...(target.id === undefined
          ? []
          : [client.query(cached(transactionQuery(target.id)))]),
        ...(target.duplicate === undefined
          ? []
          : [client.query(cached(transactionQuery(target.duplicate)))]),
      ];
    }

    case "category": {
      return [client.query(cached(categoriesQuery))];
    }

    case "invoice": {
      return [
        client.query(cached(clientsQuery(year))),
        client.query(cached(projectsQuery(null))),
        client.query(cached(financeSettingsQuery)),
        client.query(cached(businessProfileQuery)),
        ...(target.id === undefined
          ? []
          : [client.query(cached(invoiceQuery(target.id)))]),
        ...(target.duplicate === undefined
          ? []
          : [client.query(cached(invoiceQuery(target.duplicate)))]),
      ];
    }

    case "client": {
      return [
        client.query(cached(financeSettingsQuery)),
        ...(target.id === undefined
          ? []
          : [client.query(cached(clientQuery(target.id, year)))]),
      ];
    }

    case "mark-paid": {
      return [client.query(cached(invoiceQuery(target.id)))];
    }

    case "recurring": {
      return [
        client.query(cached(categoriesQuery)),
        client.query(cached(clientsQuery(year))),
        client.query(cached(recurringQuery)),
      ];
    }

    case "project": {
      return [client.query(cached(projectsQuery(null)))];
    }

    default: {
      return [];
    }
  }
};

export const prefetchFinanceDialog = async (
  client: QueryClient,
  target: FinanceDialogTarget
): Promise<void> => {
  await warmDialog(...loadsFor(client, target));
};
