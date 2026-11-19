import { ApiClientError } from "./api";

/**
 * The form field a server error belongs to, using the form's API-field → form-field map;
 * null when the error isn't about a field the form shows.
 */
export const formFieldOfError = <F extends string>(
  error: Error,
  fields: Readonly<Record<string, F>>
): F | null => {
  if (!(error instanceof ApiClientError) || error.field === undefined) {
    return null;
  }

  return Object.hasOwn(fields, error.field)
    ? (fields[error.field] ?? null)
    : null;
};
