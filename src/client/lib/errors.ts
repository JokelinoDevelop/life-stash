import { useTranslation } from "react-i18next";

import { ApiClientError, FINANCE_ERROR_CODES } from "./api";
import type { ApiErrorCode, FinanceErrorCode } from "./api";

const GENERIC = "errors.generic";

type MessageKey =
  | typeof GENERIC
  | "errors.network"
  | "errors.notFound"
  | "errors.unauthorized"
  | "errors.notConfigured"
  | "errors.validation"
  | "errors.rateLimited";

const FINANCE_MESSAGES = {
  "finances.category_archived": "errors.categoryArchived",
  "finances.category_in_use": "errors.categoryInUse",
  "finances.category_kind_mismatch": "errors.categoryKindMismatch",
  "finances.category_system": "errors.categorySystem",
  "finances.client_in_use": "errors.clientInUse",
  "finances.client_name_taken": "errors.clientNameTaken",
  "finances.invoice_already_paid": "errors.invoiceAlreadyPaid",
  "finances.invoice_not_paid": "errors.invoiceNotPaid",
  "finances.invoice_number_taken": "errors.invoiceNumberTaken",
  "finances.invoice_void": "errors.invoiceVoid",
  "finances.project_client_mismatch": "errors.projectClientMismatch",
  "finances.project_in_use": "errors.projectInUse",
  "finances.recurring_already_handled": "errors.recurringAlreadyHandled",
  "finances.transaction_linked": "errors.transactionLinked",
} as const satisfies Record<FinanceErrorCode, string>;

const isFinanceCode = (code: ApiErrorCode): code is FinanceErrorCode =>
  FINANCE_ERROR_CODES.some((known) => known === code);

const MESSAGE_FOR_CODE: Record<
  Exclude<ApiErrorCode, FinanceErrorCode>,
  MessageKey | "server"
> = {
  bad_request: "server",
  conflict: "server",
  forbidden: GENERIC,
  internal: GENERIC,
  network: "errors.network",
  not_configured: "errors.notConfigured",
  not_found: "errors.notFound",
  rate_limited: "errors.rateLimited",
  unauthorized: "errors.unauthorized",
  validation: "errors.validation",
};

/** Maps any thrown error to a translated, user-facing message. */
export const useErrorMessage = () => {
  const { t } = useTranslation();
  const { t: tf } = useTranslation("finances");

  return (error: unknown): string => {
    if (!(error instanceof ApiClientError)) {
      return t(GENERIC);
    }

    if (isFinanceCode(error.code)) {
      return tf(FINANCE_MESSAGES[error.code]);
    }

    const key = MESSAGE_FOR_CODE[error.code];

    if (key !== "server") {
      return t(key);
    }

    return error.message === "" ? t(GENERIC) : error.message;
  };
};
