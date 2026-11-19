import { Hono } from "hono";

import type { AppEnv } from "../../../core/app-env";
import { validate } from "../../../core/validate";
import { exportCsvQuery } from "./dto/export-csv.request";

/** `GET /finances/export.csv?year=&type=`: a file download, so the response is CSV, not JSON. */
export const exportController = new Hono<AppEnv>().get(
  "/",
  validate("query", exportCsvQuery),
  async (c) => {
    const { type, year } = c.req.valid("query");
    const csv = await c.var.container.finances.exports.csv(type, year);

    // The BOM makes spreadsheet apps read the file as UTF-8 (Cyrillic names).
    return c.body(`﻿${csv}`, 200, {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="lifestash-${type}-${year}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
    });
  }
);
