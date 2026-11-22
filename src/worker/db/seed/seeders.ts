import type { Seeder } from "./seeder";
import { carsSeeder } from "./seeders/cars";
import { catalogSeeder } from "./seeders/catalog";
import { extrasSeeder } from "./seeders/extras";
import { financeDocumentsSeeder } from "./seeders/finance-documents";
import { financeExtrasSeeder } from "./seeders/finance-extras";
import { financeLedgerSeeder } from "./seeders/finance-ledger";
import { financeSettingsSeeder } from "./seeders/finance-settings";
import { financeWorkSeeder } from "./seeders/finance-work";
import { fuelSeeder } from "./seeders/fuel";
import { maintenanceSeeder } from "./seeders/maintenance";
import { odometerSeeder } from "./seeders/odometer";
import { peopleSeeder } from "./seeders/people";
import { remindersSeeder } from "./seeders/reminders";
import { renewalsSeeder } from "./seeders/renewals";
import { visitsSeeder } from "./seeders/visits";

/**
 * The seed, in order. The demo account is created first (see `seeders/account.ts`); each seeder
 * after it may use what the earlier ones put on the context. To add data for a new feature,
 * write a seeder in `seeders/` and list it here.
 */
export const SEEDERS: readonly Seeder[] = [
  catalogSeeder,
  carsSeeder,
  maintenanceSeeder,
  visitsSeeder,
  renewalsSeeder,
  fuelSeeder,
  extrasSeeder,
  odometerSeeder,
  remindersSeeder,
  financeLedgerSeeder,
  financeWorkSeeder,
  financeDocumentsSeeder,
  financeExtrasSeeder,
  financeSettingsSeeder,
  peopleSeeder,
];
