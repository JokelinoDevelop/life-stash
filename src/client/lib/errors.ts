import { useTranslation } from "react-i18next";

import { ApiClientError } from "./api";
import type { ApiErrorCode } from "./api";

const GENERIC = "errors.generic";

type MessageKey =
  | typeof GENERIC
  | "errors.network"
  | "errors.notFound"
  | "errors.unauthorized"
  | "errors.notConfigured"
  | "errors.validation"
  | "errors.rateLimited";

const MESSAGE_FOR_CODE: Record<ApiErrorCode, MessageKey | "server"> = {
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

  return (error: unknown): string => {
    if (!(error instanceof ApiClientError)) {
      return t(GENERIC);
    }

    const key = MESSAGE_FOR_CODE[error.code];

    if (key !== "server") {
      return t(key);
    }

    return error.message === "" ? t(GENERIC) : error.message;
  };
};
