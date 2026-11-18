import { zValidator } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import type { ZodType } from "zod";

/** zValidator with a consistent error body: `{ error: { code: "validation", issues } }`. */
export const validate = <
  Target extends keyof ValidationTargets,
  Schema extends ZodType,
>(
  target: Target,
  schema: Schema
) =>
  zValidator(target, schema, (result, c) =>
    result.success
      ? undefined
      : c.json(
          {
            error: {
              code: "validation",
              issues: result.error.issues.map((issue) => ({
                message: issue.message,
                path: issue.path.join("."),
              })),
            },
          },
          400
        )
  );
