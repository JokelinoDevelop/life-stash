import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

import { households } from "./core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const now = () => new Date().toISOString();

const timestamps = {
  createdAt: text("created_at").notNull().$defaultFn(now),
  updatedAt: text("updated_at").notNull().$defaultFn(now).$onUpdateFn(now),
};

const householdId = () =>
  text("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" });

const currency = (name: string) => text(name, { enum: ["MKD", "EUR", "USD"] });

const precision = (name: string) =>
  text(name, { enum: ["day", "month", "year"] });

export const garageCars = sqliteTable(
  "garage_cars",
  {
    ...timestamps,
    archivedAt: text("archived_at"),
    color: text("color"),
    fuelType: text("fuel_type"),
    householdId: householdId(),
    id: id(),
    make: text("make"),
    model: text("model"),
    name: text("name").notNull(),
    notes: text("notes"),
    odometerNudgedAt: text("odometer_nudged_at"),
    plate: text("plate"),
    purchaseCurrency: currency("purchase_currency"),
    purchaseDate: text("purchase_date"),
    purchaseDatePrecision: precision("purchase_date_precision"),
    purchaseOdometerKm: integer("purchase_odometer_km"),
    purchasePriceMinor: integer("purchase_price_minor"),
    soldDate: text("sold_date"),
    vin: text("vin"),
    year: integer("year"),
  },
  (table) => [index("garage_cars_household_idx").on(table.householdId)]
);

export const garageItems = sqliteTable(
  "garage_items",
  {
    archivedAt: text("archived_at"),
    createdAt: text("created_at").notNull().$defaultFn(now),
    householdId: householdId(),
    id: id(),
    name: text("name").notNull(),
  },
  (table) => [index("garage_items_household_idx").on(table.householdId)]
);

export const garagePackages = sqliteTable(
  "garage_packages",
  {
    createdAt: text("created_at").notNull().$defaultFn(now),
    householdId: householdId(),
    id: id(),
    name: text("name").notNull(),
    notes: text("notes"),
  },
  (table) => [index("garage_packages_household_idx").on(table.householdId)]
);

export const garagePackageItems = sqliteTable(
  "garage_package_items",
  {
    itemId: text("item_id")
      .notNull()
      .references(() => garageItems.id, { onDelete: "cascade" }),
    packageId: text("package_id")
      .notNull()
      .references(() => garagePackages.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.packageId, table.itemId] })]
);

export const garageServiceVisits = sqliteTable(
  "garage_service_visits",
  {
    ...timestamps,
    byPreviousOwner: integer("by_previous_owner", { mode: "boolean" })
      .notNull()
      .default(false),
    carId: text("car_id")
      .notNull()
      .references(() => garageCars.id, { onDelete: "cascade" }),
    currency: currency("currency").notNull(),
    date: text("date").notNull(),
    datePrecision: precision("date_precision").notNull(),
    householdId: householdId(),
    id: id(),
    kind: text("kind", { enum: ["maintenance", "repair"] }).notNull(),
    notes: text("notes"),
    odometerKm: integer("odometer_km"),
    shop: text("shop"),
    totalMinor: integer("total_minor"),
  },
  (table) => [
    index("garage_visits_car_date_idx").on(table.carId, table.date),
    index("garage_visits_household_idx").on(table.householdId),
  ]
);

export const garageServiceVisitItems = sqliteTable(
  "garage_service_visit_items",
  {
    costMinor: integer("cost_minor"),
    id: id(),
    itemId: text("item_id").references(() => garageItems.id, {
      onDelete: "set null",
    }),
    label: text("label").notNull(),
    notes: text("notes"),
    position: integer("position").notNull().default(0),
    visitId: text("visit_id")
      .notNull()
      .references(() => garageServiceVisits.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("garage_visit_items_visit_idx").on(table.visitId),
    index("garage_visit_items_item_idx").on(table.itemId),
  ]
);

export const garageOdometerReadings = sqliteTable(
  "garage_odometer_readings",
  {
    carId: text("car_id")
      .notNull()
      .references(() => garageCars.id, { onDelete: "cascade" }),
    createdAt: text("created_at").notNull().$defaultFn(now),
    date: text("date").notNull(),
    householdId: householdId(),
    id: id(),
    notes: text("notes"),
    odometerKm: integer("odometer_km").notNull(),
  },
  (table) => [index("garage_readings_car_date_idx").on(table.carId, table.date)]
);

export const garageReminders = sqliteTable(
  "garage_reminders",
  {
    ...timestamps,
    carId: text("car_id")
      .notNull()
      .references(() => garageCars.id, { onDelete: "cascade" }),
    completedAt: text("completed_at"),
    completedExpenseId: text("completed_expense_id"),
    completedVisitId: text("completed_visit_id"),
    dueDate: text("due_date"),
    dueOdometerKm: integer("due_odometer_km"),
    householdId: householdId(),
    id: id(),
    intervalKm: integer("interval_km"),
    intervalMonths: integer("interval_months"),
    itemId: text("item_id").references(() => garageItems.id, {
      onDelete: "set null",
    }),
    kind: text("kind", {
      enum: ["service", "insurance", "registration", "other"],
    }).notNull(),
    notes: text("notes"),
    notifiedAt: text("notified_at"),
    packageId: text("package_id").references(() => garagePackages.id, {
      onDelete: "set null",
    }),
    previousReminderId: text("previous_reminder_id"),
    title: text("title").notNull(),
  },
  (table) => [
    index("garage_reminders_car_idx").on(table.carId, table.completedAt),
    index("garage_reminders_household_idx").on(table.householdId),
  ]
);

export const garageExpenses = sqliteTable(
  "garage_expenses",
  {
    ...timestamps,
    amountMinor: integer("amount_minor").notNull(),
    carId: text("car_id")
      .notNull()
      .references(() => garageCars.id, { onDelete: "cascade" }),
    category: text("category", {
      enum: ["fuel", "insurance", "registration", "tolls", "parking", "other"],
    }).notNull(),
    currency: currency("currency").notNull(),
    date: text("date").notNull(),
    householdId: householdId(),
    id: id(),
    notes: text("notes"),
    odometerKm: integer("odometer_km"),
    quantityMilli: integer("quantity_milli"),
  },
  (table) => [index("garage_expenses_car_date_idx").on(table.carId, table.date)]
);
