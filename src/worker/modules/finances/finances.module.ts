import type { ContainerDeps } from "../../core/container";
import { CategoriesRepository } from "./categories/categories.repository";
import { CategoriesService } from "./categories/categories.service";
import { HouseholdRepository } from "./household/household.repository";
import { TransactionsRepository } from "./transactions/transactions.repository";
import { TransactionsService } from "./transactions/transactions.service";

export interface FinancesModule {
  categories: CategoriesService;
  transactions: TransactionsService;
}

/** Wires the Finances repositories and services for one household. */
export const createFinancesModule = ({
  db,
  householdId,
}: ContainerDeps): FinancesModule => {
  const household = new HouseholdRepository(db, householdId);

  const categories = new CategoriesService(
    new CategoriesRepository(db, householdId),
    household
  );

  const transactions = new TransactionsService(
    new TransactionsRepository(db, householdId),
    categories
  );

  return { categories, transactions };
};
