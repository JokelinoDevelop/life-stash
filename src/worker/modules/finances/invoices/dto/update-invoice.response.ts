export interface UpdateInvoiceResponse {
  id: string;
  /** Its number after the change; null while still a draft. */
  number: string | null;
}
