import { Hono } from "hono";

import type { AppEnv } from "../../../core/app-env";
import { validate } from "../../../core/validate";
import { createInvoiceRequest } from "./dto/create-invoice.request";
import type { CreateInvoiceResponse } from "./dto/create-invoice.response";
import { deleteInvoiceParams } from "./dto/delete-invoice.request";
import type { DeleteInvoiceResponse } from "./dto/delete-invoice.response";
import { getInvoiceDocumentParams } from "./dto/get-invoice-document.request";
import { toGetInvoiceDocumentResponse } from "./dto/get-invoice-document.response";
import type { GetInvoiceDocumentResponse } from "./dto/get-invoice-document.response";
import { getInvoiceParams } from "./dto/get-invoice.request";
import { toGetInvoiceResponse } from "./dto/get-invoice.response";
import type { GetInvoiceResponse } from "./dto/get-invoice.response";
import {
  issueInvoiceParams,
  issueInvoiceRequest,
} from "./dto/issue-invoice.request";
import type { IssueInvoiceResponse } from "./dto/issue-invoice.response";
import { listInvoicesQuery } from "./dto/list-invoices.request";
import { toListInvoicesResponse } from "./dto/list-invoices.response";
import type { ListInvoicesResponse } from "./dto/list-invoices.response";
import { markPaidParams, markPaidRequest } from "./dto/mark-paid.request";
import type { MarkPaidResponse } from "./dto/mark-paid.response";
import { markUnpaidParams } from "./dto/mark-unpaid.request";
import type { MarkUnpaidResponse } from "./dto/mark-unpaid.response";
import { nextInvoiceNumberQuery } from "./dto/next-invoice-number.request";
import type { NextInvoiceNumberResponse } from "./dto/next-invoice-number.response";
import { restoreInvoiceParams } from "./dto/restore-invoice.request";
import type { RestoreInvoiceResponse } from "./dto/restore-invoice.response";
import { unvoidInvoiceParams } from "./dto/unvoid-invoice.request";
import type { UnvoidInvoiceResponse } from "./dto/unvoid-invoice.response";
import {
  updateInvoiceParams,
  updateInvoiceRequest,
} from "./dto/update-invoice.request";
import type { UpdateInvoiceResponse } from "./dto/update-invoice.response";
import { voidInvoiceParams } from "./dto/void-invoice.request";
import type { VoidInvoiceResponse } from "./dto/void-invoice.response";

const INVOICE_PATH = "/:invoiceId";

export const invoicesController = new Hono<AppEnv>()
  .get("/", validate("query", listInvoicesQuery), async (c) => {
    const { year: requested, ...filter } = c.req.valid("query");
    const year = requested ?? new Date().getUTCFullYear();

    const list = await c.var.container.finances.invoices.list({
      ...filter,
      year,
    });

    const body: ListInvoicesResponse = toListInvoicesResponse(year, list);

    return c.json(body);
  })
  .get("/next-number", validate("query", nextInvoiceNumberQuery), async (c) => {
    const body: NextInvoiceNumberResponse =
      await c.var.container.finances.invoices.nextNumber(
        c.req.valid("query").year
      );

    return c.json(body);
  })
  .get(
    `${INVOICE_PATH}/document`,
    validate("param", getInvoiceDocumentParams),
    async (c) => {
      const data = await c.var.container.finances.invoices.document(
        c.req.valid("param").invoiceId
      );

      const body: GetInvoiceDocumentResponse =
        toGetInvoiceDocumentResponse(data);

      return c.json(body);
    }
  )
  .get(INVOICE_PATH, validate("param", getInvoiceParams), async (c) => {
    const detail = await c.var.container.finances.invoices.get(
      c.req.valid("param").invoiceId
    );

    const body: GetInvoiceResponse = toGetInvoiceResponse(detail);

    return c.json(body);
  })
  .post("/", validate("json", createInvoiceRequest), async (c) => {
    const { issue, number, ...input } = c.req.valid("json");

    const body: CreateInvoiceResponse =
      await c.var.container.finances.invoices.create(
        input,
        issue ? { number } : null
      );

    return c.json(body, 201);
  })
  .patch(
    INVOICE_PATH,
    validate("param", updateInvoiceParams),
    validate("json", updateInvoiceRequest),
    async (c) => {
      const { invoiceId } = c.req.valid("param");
      const { issue, number, ...changes } = c.req.valid("json");

      const after = await c.var.container.finances.invoices.update(
        invoiceId,
        changes,
        issue === true ? { number: number ?? null } : null
      );

      const body: UpdateInvoiceResponse = { id: invoiceId, number: after };

      return c.json(body);
    }
  )
  .delete(INVOICE_PATH, validate("param", deleteInvoiceParams), async (c) => {
    await c.var.container.finances.invoices.delete(
      c.req.valid("param").invoiceId
    );
    const body: DeleteInvoiceResponse = { ok: true };

    return c.json(body);
  })
  .post(
    `${INVOICE_PATH}/restore`,
    validate("param", restoreInvoiceParams),
    async (c) => {
      await c.var.container.finances.invoices.restore(
        c.req.valid("param").invoiceId
      );
      const body: RestoreInvoiceResponse = { ok: true };

      return c.json(body);
    }
  )
  .post(
    `${INVOICE_PATH}/issue`,
    validate("param", issueInvoiceParams),
    validate("json", issueInvoiceRequest),
    async (c) => {
      const { invoiceId } = c.req.valid("param");

      const number = await c.var.container.finances.invoices.issue(
        invoiceId,
        c.req.valid("json").number
      );

      const body: IssueInvoiceResponse = { id: invoiceId, number };

      return c.json(body);
    }
  )
  .post(
    `${INVOICE_PATH}/void`,
    validate("param", voidInvoiceParams),
    async (c) => {
      await c.var.container.finances.invoices.markVoid(
        c.req.valid("param").invoiceId
      );
      const body: VoidInvoiceResponse = { ok: true };

      return c.json(body);
    }
  )
  .post(
    `${INVOICE_PATH}/unvoid`,
    validate("param", unvoidInvoiceParams),
    async (c) => {
      await c.var.container.finances.invoices.unvoid(
        c.req.valid("param").invoiceId
      );
      const body: UnvoidInvoiceResponse = { ok: true };

      return c.json(body);
    }
  )
  .post(
    `${INVOICE_PATH}/mark-paid`,
    validate("param", markPaidParams),
    validate("json", markPaidRequest),
    async (c) => {
      const transaction = await c.var.container.finances.invoices.markPaid(
        c.req.valid("param").invoiceId,
        c.req.valid("json")
      );

      const body: MarkPaidResponse = { transactionId: transaction.id };

      return c.json(body);
    }
  )
  .post(
    `${INVOICE_PATH}/mark-unpaid`,
    validate("param", markUnpaidParams),
    async (c) => {
      const body: MarkUnpaidResponse =
        await c.var.container.finances.invoices.markUnpaid(
          c.req.valid("param").invoiceId
        );

      return c.json(body);
    }
  );
