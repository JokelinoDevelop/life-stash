import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

import { todayIso } from "@/lib/partial-date";

import { FinanceDialogLink } from "../../../dialogs/finance-dialog-link";
import { invoicesQuery } from "../../../invoices/invoices.queries";
import { useLedgerMoney } from "../../../money";

/**
 * Income from a client with unpaid invoices: point at "Mark … paid" instead, so invoice money
 * isn't logged twice (3.2).
 */
export const InvoiceHint = ({ clientId }: { clientId: string }) => {
  const { t } = useTranslation("finances");
  const ledger = useLedgerMoney();
  const year = Number(todayIso().slice(0, 4));

  const unpaid = useQuery({
    // oxlint-disable-next-line sonarjs/shorthand-property-grouping -- conflicts with sort-keys
    ...invoicesQuery({ clientId, status: "unpaid", year }),
    enabled: clientId !== "",
  });

  const invoice = unpaid.data?.invoices.find(
    (row) => row.status === "sent" || row.status === "overdue"
  );

  if (clientId === "" || invoice === undefined) {
    return null;
  }

  return (
    <div className="bg-background text-subtle-foreground mt-3 flex items-start gap-2 rounded-md border px-3 py-2 text-xs">
      <FileText aria-hidden="true" className="mt-px size-3.5 shrink-0" />
      <p>
        {t("invoices.hint", {
          amount: ledger.money(invoice.amountMinor, invoice.currency),
          client: invoice.clientName,
        })}{" "}
        <FinanceDialogLink
          className="text-primary font-medium"
          entry={{ dialog: "mark-paid", id: invoice.id }}
        >
          {t("invoices.hintAction", { number: invoice.number ?? "" })}
        </FinanceDialogLink>
      </p>
    </div>
  );
};
