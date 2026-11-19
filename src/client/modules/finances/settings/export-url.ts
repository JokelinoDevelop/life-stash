/** The CSV download URL (a plain file response, so a link rather than the RPC client). */
export const exportUrl = (
  type: "transactions" | "invoices",
  year: number
): string => `/api/finances/export.csv?type=${type}&year=${year}`;
