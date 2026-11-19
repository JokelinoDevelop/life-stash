import type { ContainerDeps } from "../../core/container";
import { sendPushToHousehold } from "../../core/push";
import { deletePhotosOfOwners } from "../photos/photos.service";
import { AttachmentsRepository } from "./attachments/attachments.repository";
import type { AttachmentOwnerType } from "./attachments/attachments.repository";
import { CategoriesRepository } from "./categories/categories.repository";
import { CategoriesService } from "./categories/categories.service";
import { ClientsRepository } from "./clients/clients.repository";
import { ClientsService } from "./clients/clients.service";
import { FinanceExportService } from "./export/export.service";
import { FinanceClock } from "./household/clock";
import { HouseholdRepository } from "./household/household.repository";
import { InvoicesRepository } from "./invoices/invoices.repository";
import { InvoicesService } from "./invoices/invoices.service";
import { OverdueRemindersService } from "./notifications/overdue-reminders.service";
import { GarageCostsReader } from "./overview/garage-costs";
import { OverviewService } from "./overview/overview.service";
import { ProjectsRepository } from "./projects/projects.repository";
import { ProjectsService } from "./projects/projects.service";
import { RecurringRepository } from "./recurring/recurring.repository";
import { RecurringService } from "./recurring/recurring.service";
import { FinanceSettingsRepository } from "./settings/settings.repository";
import { FinanceSettingsService } from "./settings/settings.service";
import { LedgerLinksRepository } from "./transactions/ledger-links.repository";
import { TransactionsRepository } from "./transactions/transactions.repository";
import { TransactionsService } from "./transactions/transactions.service";

export interface FinancesModule {
  categories: CategoriesService;
  clients: ClientsService;
  invoices: InvoicesService;
  overview: OverviewService;
  projects: ProjectsService;
  recurring: RecurringService;
  exports: FinanceExportService;
  overdueReminders: OverdueRemindersService;
  settings: FinanceSettingsService;
  transactions: TransactionsService;
  /** Removes stored files of purged records (B2 objects and `photos` rows). */
  deleteFiles: (
    ownerType: AttachmentOwnerType,
    ownerIds: string[]
  ) => Promise<void>;
}

// Wiring reads best with matching names; sort-keys and shorthand grouping fight over it here.
// oxlint-disable sonarjs/shorthand-property-grouping

/** Wires the Finances repositories and services for one household. */
export const createFinancesModule = ({
  db,
  env,
  householdId,
}: ContainerDeps): FinancesModule => {
  const household = new HouseholdRepository(db, householdId);
  const clock = new FinanceClock(household);
  const attachments = new AttachmentsRepository(db, householdId);
  const transactionsRepo = new TransactionsRepository(db, householdId);
  const invoicesRepo = new InvoicesRepository(db, householdId);
  const ledgerLinks = new LedgerLinksRepository(db, householdId);

  const settings = new FinanceSettingsService(
    new FinanceSettingsRepository(db, householdId)
  );

  const categories = new CategoriesService(
    new CategoriesRepository(db, householdId),
    household
  );

  const clientsRepo = new ClientsRepository(db, householdId);

  const clients = new ClientsService(
    clientsRepo,
    invoicesRepo,
    ledgerLinks,
    clock
  );

  const transactions = new TransactionsService({
    attachments,
    categories,
    clients,
    repo: transactionsRepo,
  });

  const projects = new ProjectsService({
    clients,
    invoices: invoicesRepo,
    repo: new ProjectsRepository(db, householdId),
  });

  const recurring = new RecurringService({
    categories,
    clients,
    clock,
    repo: new RecurringRepository(db, householdId),
    transactions: transactionsRepo,
  });

  const invoices = new InvoicesService({
    attachments,
    categories,
    clients,
    clock,
    projects,
    repo: invoicesRepo,
    settings,
    transactions: ledgerLinks,
  });

  const overview = new OverviewService({
    categories,
    clock,
    garage: new GarageCostsReader(db, householdId),
    invoices,
    recurring,
    transactions: transactionsRepo,
  });

  const exports = new FinanceExportService({
    categories,
    clients: clientsRepo,
    clock,
    invoices: invoicesRepo,
    transactions: transactionsRepo,
  });

  const overdueReminders = new OverdueRemindersService({
    clock,
    household,
    invoices: invoicesRepo,
    send: async (message) => {
      await sendPushToHousehold(env, db, householdId, message);
    },
    settings,
  });

  return {
    categories,
    clients,
    exports,
    overdueReminders,
    projects,
    recurring,
    deleteFiles: async (ownerType, ownerIds) => {
      await deletePhotosOfOwners(env, db, householdId, { ownerIds, ownerType });
    },
    invoices,
    overview,
    settings,
    transactions,
  };
};
