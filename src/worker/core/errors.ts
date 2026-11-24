import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

/** Error codes the client can translate; never leak internal details. */
export type ApiErrorCode =
  | "bad_request"
  | "conflict"
  | "forbidden"
  | "not_found"
  | "not_configured"
  | "rate_limited"
  /** The session is too old for this action: confirm it's you (sign in again) and retry. */
  | "reauth_required"
  | "unauthorized"
  | "validation"
  | AccountErrorCode
  | FinanceErrorCode
  | FitnessErrorCode;

/** Account and invite error codes; the client translates each one (`errors.*` in common). */
export type AccountErrorCode =
  | "account.already_member"
  | "account.cannot_change_self"
  | "account.email_taken"
  | "account.invite_invalid";

/** Finances error codes; the client translates each one (`finances:errors.*`). */
export type FinanceErrorCode =
  | "finances.category_archived"
  | "finances.category_in_use"
  | "finances.category_kind_mismatch"
  | "finances.category_system"
  | "finances.client_in_use"
  | "finances.client_name_taken"
  | "finances.invoice_issued"
  | "finances.invoice_not_issued"
  | "finances.invoice_number_invalid"
  | "finances.invoice_void"
  | "finances.profile_incomplete"
  | "finances.project_client_mismatch"
  | "finances.project_in_use"
  | "finances.recurring_already_handled"
  | "finances.invoice_already_paid"
  | "finances.invoice_not_paid"
  | "finances.invoice_number_taken"
  | "finances.transaction_linked";

/** Fitness error codes; the client translates each one (`fitness:errors.*`). */
export type FitnessErrorCode =
  | "fitness.not_an_occurrence"
  | "fitness.session_needs_training"
  | "fitness.training_archived";

export class ApiError extends Error {
  override readonly name = "ApiError";
  readonly code: ApiErrorCode;
  readonly status: ContentfulStatusCode;
  /** The request field the error is about, so the client can show it on that input. */
  readonly field: string | undefined;

  constructor(
    status: ContentfulStatusCode,
    code: ApiErrorCode,
    message?: string,
    field?: string
  ) {
    super(message ?? code);
    this.code = code;
    this.status = status;
    this.field = field;
  }
}

/** A business-rule error with a typed code (and optionally the field it concerns). */
export const domainError = (
  code: AccountErrorCode | FinanceErrorCode | FitnessErrorCode,
  options: { status?: ContentfulStatusCode; field?: string } = {}
): ApiError => new ApiError(options.status ?? 409, code, code, options.field);

export const notFound = (): ApiError => new ApiError(404, "not_found");

export const badRequest = (message?: string): ApiError =>
  new ApiError(400, "bad_request", message);

export const conflict = (message?: string): ApiError =>
  new ApiError(409, "conflict", message);

export const unauthorized = (): ApiError => new ApiError(401, "unauthorized");

interface ErrorBody {
  code: ApiErrorCode;
  message: string;
  field?: string;
}

export const handleError = (error: Error, c: Context) => {
  if (error instanceof ApiError) {
    const body: ErrorBody = {
      code: error.code,
      message: error.message,
    };

    if (error.field !== undefined) {
      body.field = error.field;
    }

    return c.json({ error: body }, error.status);
  }

  if (error instanceof HTTPException) {
    return c.json(
      { error: { code: "bad_request", message: error.message } },
      error.status
    );
  }

  console.error("Unhandled error", error);

  return c.json(
    { error: { code: "internal", message: "Something went wrong" } },
    500
  );
};
