import { CircleCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { SwipeAction } from "@/components/app/swipe-actions";

import { useFinanceDialog } from "../dialogs/use-finance-dialog";

/** Phone swipe action on an unpaid invoice: Mark paid (opens the same dialog as the button). */
export const useInvoiceSwipe = () => {
  const { t } = useTranslation("finances");
  const dialog = useFinanceDialog();

  return (invoice: { id: string; status: string }): SwipeAction[] =>
    invoice.status === "sent" || invoice.status === "overdue"
      ? [
          {
            icon: <CircleCheck />,
            label: t("invoices.markPaid"),
            onSelect: () => {
              void dialog.open({ dialog: "mark-paid", id: invoice.id });
            },
            tone: "success",
          },
        ]
      : [];
};
