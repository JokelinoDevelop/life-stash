import { z } from "zod";

export const invoicesSearchSchema = z.object({
  client: z.string().min(1).optional().catch(undefined),
  status: z.enum(["unpaid", "paid"]).optional().catch(undefined),
  year: z.coerce.number().int().min(1990).max(2200).optional().catch(undefined),
});

export type InvoicesSearch = z.infer<typeof invoicesSearchSchema>;

/** A change to the filters; `null` removes a key from the URL. */
export type InvoicesSearchPatch = {
  [K in keyof InvoicesSearch]?: InvoicesSearch[K] | null;
};

export const applyInvoicesPatch = (
  search: InvoicesSearch,
  patch: InvoicesSearchPatch
): InvoicesSearch => ({
  client: patch.client === null ? undefined : (patch.client ?? search.client),
  status: patch.status === null ? undefined : (patch.status ?? search.status),
  year: patch.year === null ? undefined : (patch.year ?? search.year),
});
