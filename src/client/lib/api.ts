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
  | "unauthorized"
  | "validation";

export class ApiClientError extends Error {
  override readonly name = "ApiClientError";
  readonly code: ApiErrorCode;
  readonly status: number;

  constructor(code: ApiErrorCode, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const ERROR_CODES: readonly ApiErrorCode[] = [
  "bad_request",
  "conflict",
  "forbidden",
  "internal",
  "not_configured",
  "not_found",
  "unauthorized",
  "validation",
];

const isErrorCode = (value: unknown): value is ApiErrorCode =>
  ERROR_CODES.some((code) => code === value);

interface FailedResponse {
  status: number;
  statusText: string;
  json: () => Promise<unknown>;
}

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

  return new ApiClientError(
    isErrorCode(code) ? code : "internal",
    response.status,
    message
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
