type Cell = string | number | boolean | null;

const escapeCell = (value: Cell): string => {
  if (value === null) {
    return "";
  }

  const text = String(value);

  return /[",\n\r]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

/** RFC 4180 CSV with a header row and CRLF line endings. */
export const toCsv = (header: string[], rows: Cell[][]): string =>
  [header, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");
