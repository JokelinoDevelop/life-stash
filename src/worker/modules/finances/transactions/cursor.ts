import type { TransactionCursor } from "./transactions.repository";

/** Opaque paging cursor: base64url of `date|createdAt|id`. */
export const encodeCursor = (cursor: TransactionCursor): string =>
  btoa(`${cursor.date}|${cursor.createdAt}|${cursor.id}`)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");

export const decodeCursor = (value: string): TransactionCursor | null => {
  try {
    const [date, createdAt, id] = atob(
      value.replaceAll("-", "+").replaceAll("_", "/")
    ).split("|");

    if (date === undefined || createdAt === undefined || id === undefined) {
      return null;
    }

    return { createdAt, date, id };
  } catch {
    return null;
  }
};
