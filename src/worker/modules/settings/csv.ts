type Cell = string | number | boolean | null;

/** Text a spreadsheet would run as a formula (=, +, -, @, tab, CR at the start). */
const FORMULA_START = /^[=+\-@\t\r]/u;

const escapeCell = (value: Cell): string => {
  if (value === null) {
    return "";
  }

  // A leading apostrophe keeps user text (descriptions, names) from running as a formula.
  const text =
    !Number.isFinite(value) && FORMULA_START.test(String(value))
      ? `'${value}`
      : String(value);

  return /[",\n\r]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

/** RFC 4180 CSV with a header row and CRLF line endings. */
export const toCsv = (header: string[], rows: Cell[][]): string =>
  [header, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");
