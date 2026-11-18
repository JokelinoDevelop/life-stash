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
  | "unauthorized"
  | "validation";

export class ApiError extends Error {
  override readonly name = "ApiError";
  readonly code: ApiErrorCode;
  readonly status: ContentfulStatusCode;

  constructor(
    status: ContentfulStatusCode,
    code: ApiErrorCode,
    message?: string
  ) {
    super(message ?? code);
    this.code = code;
    this.status = status;
  }
}

export const notFound = (): ApiError => new ApiError(404, "not_found");

export const badRequest = (message?: string): ApiError =>
  new ApiError(400, "bad_request", message);

export const conflict = (message?: string): ApiError =>
  new ApiError(409, "conflict", message);

export const unauthorized = (): ApiError => new ApiError(401, "unauthorized");

export const handleError = (error: Error, c: Context) => {
  if (error instanceof ApiError) {
    return c.json(
      { error: { code: error.code, message: error.message } },
      error.status
    );
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
