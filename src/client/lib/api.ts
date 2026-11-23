import { hc } from "hono/client";
import type { ClientResponse } from "hono/client";

import type { AppType } from "../../worker/app";

/** Typed API client. Request and response types come from the backend DTOs via Hono RPC. */
export const { api } = hc<AppType>("/", {
  init: { credentials: "same-origin" },
});

export type ApiErrorCode =
  | "bad_request"
  | "conflict"
  | "forbidden"
  | "internal"
  | "network"
  | "not_configured"
  | "not_found"
  | "rate_limited"
  | "reauth_required"
  | "unauthorized"
  | "validation"
  | AccountErrorCode
  | FinanceErrorCode;

export const ACCOUNT_ERROR_CODES = [
  "account.already_member",
  "account.cannot_change_self",
  "account.email_taken",
  "account.invite_invalid",
] as const;

export type AccountErrorCode = (typeof ACCOUNT_ERROR_CODES)[number];

export const FINANCE_ERROR_CODES = [
  "finances.category_archived",
  "finances.category_in_use",
  "finances.category_kind_mismatch",
  "finances.category_system",
  "finances.client_in_use",
  "finances.client_name_taken",
  "finances.invoice_already_paid",
  "finances.invoice_issued",
  "finances.invoice_not_issued",
  "finances.invoice_not_paid",
  "finances.invoice_number_invalid",
  "finances.invoice_number_taken",
  "finances.invoice_void",
  "finances.profile_incomplete",
  "finances.project_client_mismatch",
  "finances.project_in_use",
  "finances.recurring_already_handled",
  "finances.transaction_linked",
] as const;

export type FinanceErrorCode = (typeof FINANCE_ERROR_CODES)[number];

export class ApiClientError extends Error {
  override readonly name = "ApiClientError";
  readonly code: ApiErrorCode;
  readonly status: number;
  /** The request field the server blamed, if any (e.g. `number` for a taken invoice number). */
  readonly field: string | undefined;

  constructor(
    code: ApiErrorCode,
    status: number,
    message: string,
    field?: string
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.field = field;
  }
}

const ERROR_CODES: readonly ApiErrorCode[] = [
  "bad_request",
  "conflict",
  "forbidden",
  "internal",
  "not_configured",
  "not_found",
  "rate_limited",
  "reauth_required",
  "unauthorized",
  "validation",
  ...ACCOUNT_ERROR_CODES,
  ...FINANCE_ERROR_CODES,
];

const isErrorCode = (value: unknown): value is ApiErrorCode =>
  ERROR_CODES.some((code) => code === value);

interface FailedResponse {
  status: number;
  statusText: string;
  json: () => Promise<unknown>;
}

const fieldOf = (error: unknown): string | undefined => {
  if (typeof error !== "object" || error === null || !("field" in error)) {
    return undefined;
  }

  return typeof error.field === "string" ? error.field : undefined;
};

const readError = async (response: FailedResponse): Promise<ApiClientError> => {
  const body = await response.json().catch(() => null);

  const error =
    typeof body === "object" && body !== null && "error" in body
      ? body.error
      : null;

  const code =
    typeof error === "object" && error !== null && "code" in error
      ? error.code
      : null;

  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String(error.message)
      : response.statusText;

  const field = fieldOf(error);

  return new ApiClientError(
    isErrorCode(code) ? code : "internal",
    response.status,
    message,
    field
  );
};

type BodyOf<R> =
  R extends ClientResponse<infer Body, number, "json"> ? Body : never;

/** The success DTO of an RPC response (error bodies all carry an `error` key). */
export type SuccessBody<R> = Exclude<BodyOf<R>, { error: unknown }>;

/** Awaits an RPC call, throws `ApiClientError` on failure and returns the typed success body. */
export const unwrap = async <R extends ClientResponse<unknown, number>>(
  request: Promise<R>
): Promise<SuccessBody<R>> => {
  const response = await request.catch((error: unknown) => {
    throw new ApiClientError("network", 0, String(error));
  });

  if (!response.ok) {
    throw await readError(response);
  }

  // SAFETY: non-2xx responses were thrown above, so the body is the endpoint's success DTO.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return (await response.json()) as SuccessBody<R>;
};
