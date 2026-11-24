import { daysBetween } from "@shared/domain/dates";
import { z } from "zod";

import { isoDate } from "../../../../core/zod-primitives";

const MAX_RANGE_DAYS = 400;

export const getCalendarQuery = z
  .object({ from: isoDate, to: isoDate })
  .refine(
    ({ from, to }) => from <= to && daysBetween(from, to) <= MAX_RANGE_DAYS,
    { message: "Expected from ≤ to, at most 400 days apart", path: ["to"] }
  );
