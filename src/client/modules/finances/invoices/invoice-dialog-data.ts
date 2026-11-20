import type { Currency } from "@shared/domain/money";
import { useQuery } from "@tanstack/react-query";

import { emptyToNull } from "@/lib/form-schemas";
import { todayIso } from "@/lib/partial-date";

import { clientsQuery } from "../clients/clients.queries";
import { projectsQuery } from "../projects/projects.queries";
import {
  duplicateToFormValues,
  invoiceFormDefaults,
} from "./forms/invoice-form/mapper";
import type { InvoiceClientOption } from "./forms/invoice-form/mapper";
import type { InvoiceFormValues } from "./forms/invoice-form/schema";
import type { InvoiceDetail } from "./invoices.queries";
import { useConfirmIssue } from "./use-invoice-actions";

/** Clients that can be invoiced (active ones, plus the invoice's own if archived). */
export const useClientOptions = (keep: string | null) => {
  const year = Number(todayIso().slice(0, 4));
  const clients = useQuery(clientsQuery(year));

  const options: InvoiceClientOption[] = (clients.data?.clients ?? []).filter(
    (client) => !client.archived || client.id === keep
  );

  const projects = useQuery(projectsQuery(null));

  // oxlint-disable-next-line sonarjs/shorthand-property-grouping -- conflicts with sort-keys
  return {
    isPending: clients.isPending || projects.isPending,
    options,
    projects: projects.data?.projects ?? [],
  };
};

/** A fresh invoice (for `forClient` if given), or a copy of `source` one month on. */
export const newInvoiceDefaults = (context: {
  clients: readonly InvoiceClientOption[];
  currency: Currency;
  forClient: string | undefined;
  source: InvoiceDetail | undefined;
  terms: number;
}) =>
  context.source === undefined
    ? invoiceFormDefaults({
        client: context.clients.find(
          (client) => client.id === context.forClient
        ),
        currency: context.currency,
        termsDays: context.terms,
        today: todayIso(),
      })
    : duplicateToFormValues(context.source);

/** Asks before issuing (the number can't change afterwards); true when it may go ahead. */
export const useIssueGate = () => {
  const confirmIssue = useConfirmIssue();

  return async (values: InvoiceFormValues, issue: boolean) =>
    !issue ||
    (await confirmIssue(values.issueDate, emptyToNull(values.number)));
};
