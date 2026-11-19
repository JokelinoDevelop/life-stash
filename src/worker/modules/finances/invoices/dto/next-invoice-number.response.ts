export interface NextInvoiceNumberResponse {
  number: string;
  /** The number it continues from, for the "Next after …" hint. */
  previous: string | null;
}
