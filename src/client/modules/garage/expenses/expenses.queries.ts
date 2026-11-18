import { queryOptions } from "@tanstack/react-query";

import { api, unwrap } from "@/lib/api";
import type { SuccessBody } from "@/lib/api";

export const expensesQuery = (carId: string) =>
  queryOptions({
    queryFn: async () =>
      await unwrap(api.garage.expenses.$get({ query: { carId } })),
    queryKey: ["garage", "expenses", carId] as const,
  });

export const expenseQuery = (expenseId: string) =>
  queryOptions({
    queryFn: async () =>
      await unwrap(
        api.garage.expenses[":expenseId"].$get({ param: { expenseId } })
      ),
    queryKey: ["garage", "expense", expenseId] as const,
  });

export type ExpenseListItem = SuccessBody<
  Awaited<ReturnType<typeof api.garage.expenses.$get>>
>["expenses"][number];

export type ExpenseDetail = SuccessBody<
  Awaited<ReturnType<(typeof api.garage.expenses)[":expenseId"]["$get"]>>
>["expense"];
