import type { Currency } from "@shared/domain/money";
import { useQuery } from "@tanstack/react-query";

import { emptyToNull } from "@/lib/form-schemas";
import { todayIso } from "@/lib/partial-date";

import { businessProfileQuery } from "../business-profile/business-profile.queries";
import { clientsQuery } from "../clients/clients.queries";
import { projectsQuery } from "../projects/projects.queries";
import { financeSettingsQuery } from "../settings/finance-settings.queries";
import {
  duplicateToFormValues,
  invoiceFormDefaults,
} from "./forms/invoice-form/mapper";
import type { InvoiceClientOption } from "./forms/invoice-form/mapper";
import type { InvoiceFormValues } from "./forms/invoice-form/schema";
import type { InvoiceDetail } from "./invoices.queries";
import { useConfirmIssue } from "./use-invoice-actions";

const DEFAULT_TERMS = 30;

/**
 * What the invoice editor needs besides the invoice: clients that can be invoiced (active,
 * plus the invoice's own if archived), projects, default terms and your details.
 */
export const useEditorContext = (keepClient: string | null) => {
  const year = Number(todayIso().slice(0, 4));
  const clients = useQuery(clientsQuery(year));
  const projects = useQuery(projectsQuery(null));
  const settings = useQuery(financeSettingsQuery);
  const profile = useQuery(businessProfileQuery);

  const options: InvoiceClientOption[] = (clients.data?.clients ?? []).filter(
    (client) => !client.archived || client.id === keepClient
  );

  return {
    clients: options,
    isPending: [clients, projects, settings, profile].some(
      (query) => query.isPending
    ),
    profile: profile.data?.profile ?? null,
    projects: projects.data?.projects ?? [],
    terms: settings.data?.defaultPaymentTermsDays ?? DEFAULT_TERMS,
  };
};

/** A fresh invoice (for `forClient` if given), or a copy of `source` one month on. */
export const newInvoiceDefaults = (context: {
  clients: readonly InvoiceClientOption[];
  currency: Currency;
  forClient: string | undefined;
  source: InvoiceDetail | undefined;
  terms: number;
  defaultVatRateBp: number;
}) =>
  context.source === undefined
    ? invoiceFormDefaults({
        client: context.clients.find(
          (client) => client.id === context.forClient
        ),
        currency: context.currency,
        defaultVatRateBp: context.defaultVatRateBp,
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
