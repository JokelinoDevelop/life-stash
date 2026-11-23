import type { TransactionKind } from "@shared/domain/finances/kinds";
import { isTransactionKind } from "@shared/domain/finances/kinds";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { useIsDesktop } from "@/components/app/responsive-dialog";
import { DialogForm } from "@/components/form/dialog-form";
import { useAppForm } from "@/components/form/form-hook";
import { useErrorMessage } from "@/lib/errors";
import { formFieldOfError } from "@/lib/server-errors";

import type { FinanceCategory } from "../../../categories/categories.queries";
import type { ClientOption } from "./client-picker";
import { KindToggle } from "./kind-toggle";
import { TRANSACTION_SERVER_FIELDS } from "./mapper";
import { transactionFormSchema } from "./schema";
import type { TransactionFormValues } from "./schema";
import { DesktopBody, MobileBody } from "./transaction-form-body";

export interface TransactionFormProps {
  defaultValues: TransactionFormValues;
  categories: readonly FinanceCategory[];
  /** Clients that can be picked for income. */
  clients: readonly ClientOption[];
  /** The receipt control: a chip for a new entry, the file list when editing. */
  receipt?: ReactNode;
  /** Left side of the footer, e.g. Delete when editing. */
  footerStart?: ReactNode;
  onCancel: () => void;
  /** Throws the API error on failure; field errors are shown on their input. */
  onSubmit: (values: TransactionFormValues) => Promise<void>;
}

/** Log or edit an income/expense: big amount, description, category/date chips (3.1, 3.2, 5.4). */
export const TransactionForm = ({
  categories,
  clients,
  receipt,
  defaultValues,
  footerStart,
  onCancel,
  onSubmit,
}: TransactionFormProps) => {
  const { t } = useTranslation("finances");
  const isDesktop = useIsDesktop();
  const errorMessage = useErrorMessage();

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        await onSubmit(value);
      } catch (error) {
        const field =
          error instanceof Error
            ? formFieldOfError(error, TRANSACTION_SERVER_FIELDS)
            : null;

        if (field !== null) {
          form.setFieldMeta(field, (meta) => ({
            ...meta,
            errorMap: { ...meta.errorMap, onSubmit: errorMessage(error) },
            isTouched: true,
          }));
        }
      }
    },
    validators: { onSubmit: transactionFormSchema },
  });

  /** Options for the picker: active categories of the kind, plus the current one if archived. */
  const optionsFor = (kind: TransactionKind, current: string) =>
    categories.filter(
      (category) =>
        category.kind === kind &&
        (!category.archived || category.id === current) &&
        category.systemKey === null
    );

  const changeKind = (next: string) => {
    if (!isTransactionKind(next)) {
      return;
    }

    form.setFieldValue("kind", next);
    const current = form.getFieldValue("categoryId");

    const stillFits = categories.some(
      (category) => category.id === current && category.kind === next
    );

    if (!stillFits) {
      form.setFieldValue("categoryId", "");
    }
  };

  const Body = isDesktop ? DesktopBody : MobileBody;

  return (
    <DialogForm
      footer={
        <form.AppForm>
          <form.Subscribe selector={(state) => state.values.kind}>
            {(kind) => (
              <form.FormFooter
                onCancel={onCancel}
                start={footerStart}
                submitLabel={
                  kind === "income"
                    ? t("form.saveIncome")
                    : t("form.saveExpense")
                }
              />
            )}
          </form.Subscribe>
        </form.AppForm>
      }
      onSubmit={() => {
        void form.handleSubmit();
      }}
    >
      <div className="flex flex-col px-4 pt-1 pb-4">
        <form.Subscribe selector={(state) => state.values.kind}>
          {(kind) => (
            <KindToggle
              centered={!isDesktop}
              kind={kind}
              onChange={changeKind}
            />
          )}
        </form.Subscribe>
        <Body
          clients={clients}
          form={form}
          optionsFor={optionsFor}
          receipt={receipt ?? null}
        />
      </div>
    </DialogForm>
  );
};
