import {
  Ban,
  Copy,
  Download,
  MoreHorizontal,
  RefreshCw,
  Undo2,
} from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { useIsDesktop } from "@/components/app/responsive-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useFinanceDialog } from "../dialogs/use-finance-dialog";
import { useDownloadInvoicePdf } from "./invoice-document";
import type { InvoiceDetail } from "./invoices.queries";
import { useInvoiceActions } from "./use-invoice-actions";

interface FooterAction {
  id: string;
  icon?: ReactNode;
  label: string;
  onSelect: () => void;
}

/**
 * Phones: the main action full width (48px) with the rest in a "…" menu
 * beside it, like every sheet footer, instead of a wrapping row of buttons.
 */
const PhoneFooter = ({
  primary,
  secondary,
}: {
  primary: FooterAction;
  secondary: FooterAction[];
}) => {
  const { t } = useTranslation();

  return (
    <div className="border-divider pb-safe-2.5 flex shrink-0 items-center gap-2 border-t px-3 pt-2.5">
      {secondary.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                aria-label={t("actions.more")}
                className="size-12"
                size="icon-compact"
                variant="outline"
              />
            }
          >
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56" side="top">
            {secondary.map((action) => (
              <DropdownMenuItem
                key={action.id}
                onClick={() => {
                  action.onSelect();
                }}
              >
                {action.icon}
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <Button
        onClick={() => {
          primary.onSelect();
        }}
        size="submit"
      >
        {primary.icon}
        {primary.label}
      </Button>
    </div>
  );
};

type PlacedAction = FooterAction & { show: boolean; place: "start" | "end" };

/** The shown actions, split by where the desktop footer puts them. */
const byPlace = (actions: PlacedAction[]) => {
  const start: FooterAction[] = [];
  const end: FooterAction[] = [];

  for (const action of actions) {
    if (action.show) {
      (action.place === "start" ? start : end).push(action);
    }
  }

  return { end, start };
};

/** On desktop only the PDF buttons carry an icon. */
const WITH_ICON = new Set(["download", "regenerate"]);

const FooterButton = ({
  action,
  variant,
}: {
  action: FooterAction;
  variant: "default" | "ghost" | "outline";
}) => {
  const handleClick = () => {
    action.onSelect();
  };

  return (
    <Button onClick={handleClick} size="compact" variant={variant}>
      {WITH_ICON.has(action.id) && action.icon}
      {action.label}
    </Button>
  );
};

/** Desktop: quiet actions on the left; the PDF, Duplicate and the main action on the right. */
const DesktopFooter = ({
  end,
  primary,
  start,
}: {
  end: FooterAction[];
  primary: FooterAction[];
  start: FooterAction[];
}) => (
  <div className="border-divider pb-safe-2.5 flex shrink-0 flex-wrap items-center gap-2 border-t px-3 pt-2.5">
    {start.map((action) => (
      <FooterButton action={action} key={action.id} variant="ghost" />
    ))}
    <span className="flex-1" />
    {end.map((action) => (
      <FooterButton action={action} key={action.id} variant="outline" />
    ))}
    {primary.map((action, index) => (
      <FooterButton
        action={action}
        key={action.id}
        variant={index === primary.length - 1 ? "default" : "outline"}
      />
    ))}
  </div>
);

/**
 * Footer actions by status: void / mark paid (sent), mark unpaid (paid), un-void (void),
 * duplicate (all); itemised: download and regenerate the PDF.
 */
export const ViewFooter = ({
  invoice,
  onClose,
}: {
  invoice: InvoiceDetail;
  onClose: () => Promise<void>;
}) => {
  const { t } = useTranslation("finances");
  const dialog = useFinanceDialog();
  const actions = useInvoiceActions();
  const download = useDownloadInvoicePdf();
  const isDesktop = useIsDesktop();
  const unpaid = invoice.status === "sent" || invoice.status === "overdue";

  const duplicate: FooterAction = {
    icon: <Copy />,
    id: "duplicate",
    label: t("invoices.duplicate"),
    onSelect: () => {
      void dialog.open({ dialog: "invoice", duplicate: invoice.id });
    },
  };

  const markPaid: FooterAction = {
    id: "paid",
    label: t("invoices.markPaid"),
    onSelect: () => {
      void dialog.open({ dialog: "mark-paid", id: invoice.id });
    },
  };

  // `start`: quiet buttons on the left on desktop; `end`: beside Duplicate.
  const extras: (FooterAction & { show: boolean; place: "start" | "end" })[] = [
    {
      icon: <Ban />,
      id: "void",
      label: t("invoices.void"),
      onSelect: () => {
        void (async () => {
          if (await actions.markVoid(invoice)) {
            await onClose();
          }
        })();
      },
      place: "start",
      show: unpaid,
    },
    {
      icon: <Undo2 />,
      id: "unvoid",
      label: t("invoices.unvoid"),
      onSelect: () => {
        void actions.unvoid(invoice);
      },
      place: "start",
      show: invoice.status === "void",
    },
    {
      icon: <RefreshCw />,
      id: "regenerate",
      label: t("invoices.regeneratePdf"),
      onSelect: () => {
        void actions.regeneratePdf(invoice);
      },
      place: "start",
      show: actions.canRegeneratePdf(invoice),
    },
    {
      icon: <Download />,
      id: "download",
      label: t("invoices.downloadPdf"),
      onSelect: () => {
        void download(invoice);
      },
      place: "end",
      show: invoice.itemised,
    },
    {
      icon: <Undo2 />,
      id: "unpaid",
      label: t("invoices.unpaidConfirm"),
      onSelect: () => {
        void actions.markUnpaid(invoice);
      },
      place: "end",
      show: invoice.status === "paid",
    },
  ];

  const { end, start } = byPlace(extras);

  if (!isDesktop) {
    return (
      <PhoneFooter
        primary={unpaid ? markPaid : duplicate}
        secondary={unpaid ? [...start, ...end, duplicate] : [...start, ...end]}
      />
    );
  }

  return (
    <DesktopFooter
      end={end}
      primary={unpaid ? [duplicate, markPaid] : [duplicate]}
      start={start}
    />
  );
};
