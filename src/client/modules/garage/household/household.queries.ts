import { queryOptions } from "@tanstack/react-query";

import { api, unwrap } from "@/lib/api";
import type { SuccessBody } from "@/lib/api";

import { garageKeys } from "../garage-keys";

export const householdOverviewQuery = queryOptions({
  queryFn: async () => await unwrap(api.garage.overview.$get()),
  queryKey: garageKeys.household,
});

export type HouseholdOverview = SuccessBody<
  Awaited<ReturnType<typeof api.garage.overview.$get>>
>;

export type HouseholdReminder = HouseholdOverview["reminders"][number];
