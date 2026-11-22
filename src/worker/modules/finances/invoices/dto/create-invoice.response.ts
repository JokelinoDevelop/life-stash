export interface CreateInvoiceResponse {
  id: string;
  /** The number it was issued with; null for a draft. */
  number: string | null;
}
