import { and, eq, inArray, isNull } from "drizzle-orm";

import type { Db } from "../../core/db";
import type { Bindings } from "../../core/env";
import { conflict, notFound } from "../../core/errors";
import { photoStorageFor } from "../../core/photo-storage";
import { photos } from "../../db/schema/core";
import { financeInvoices, financeTransactions } from "../../db/schema/finances";
import { garageExpenses, garageServiceVisits } from "../../db/schema/garage";

export type PhotoOwnerType =
  | "service_visit"
  | "expense"
  | "finance_invoice"
  | "finance_transaction";

const OWNER_TABLES = {
  expense: garageExpenses,
  finance_invoice: financeInvoices,
  finance_transaction: financeTransactions,
  service_visit: garageServiceVisits,
} as const;

/** Throws 404 unless the photo owner (visit, expense, invoice, transaction) belongs to the household. */
export const assertPhotoOwner = async (
  db: Db,
  householdId: string,
  owner: { ownerType: PhotoOwnerType; ownerId: string }
): Promise<void> => {
  const table = OWNER_TABLES[owner.ownerType];

  const [row] = await db
    .select({ id: table.id })
    .from(table)
    .where(and(eq(table.id, owner.ownerId), eq(table.householdId, householdId)))
    .limit(1);

  if (!row) {
    throw notFound();
  }
};

/**
 * A generated PDF is the file an issued invoice was sent as, so it can't be removed: only an
 * issued invoice may get one, and only one.
 */
export const assertGeneratedPdfAllowed = async (
  db: Db,
  householdId: string,
  invoiceId: string
): Promise<void> => {
  const [invoice] = await db
    .select({ status: financeInvoices.status })
    .from(financeInvoices)
    .where(
      and(
        eq(financeInvoices.id, invoiceId),
        eq(financeInvoices.householdId, householdId),
        isNull(financeInvoices.deletedAt)
      )
    )
    .limit(1);

  if (!invoice) {
    throw notFound();
  }

  if (invoice.status === "draft") {
    throw conflict("Only issued invoices get a generated PDF");
  }

  const [existing] = await db
    .select({ id: photos.id })
    .from(photos)
    .where(
      and(
        eq(photos.householdId, householdId),
        eq(photos.ownerType, "finance_invoice"),
        eq(photos.ownerId, invoiceId),
        eq(photos.generated, true)
      )
    )
    .limit(1);

  if (existing) {
    throw conflict("This invoice already has its generated PDF");
  }
};

const removeRows = async (
  env: Bindings,
  db: Db,
  rows: { id: string; objectKey: string }[]
): Promise<void> => {
  if (rows.length === 0) {
    return;
  }

  const storage = photoStorageFor(env);

  if (storage) {
    const results = await Promise.allSettled(
      rows.map(async (row) => {
        await storage.remove(row.objectKey);
      })
    );

    for (const result of results) {
      if (result.status === "rejected") {
        console.warn("Photo delete failed", result.reason);
      }
    }
  }

  await db.delete(photos).where(
    inArray(
      photos.id,
      rows.map((row) => row.id)
    )
  );
};

/** Deletes photos (storage objects and rows) of the given owners. */
export const deletePhotosOfOwners = async (
  env: Bindings,
  db: Db,
  householdId: string,
  owner: { ownerType: PhotoOwnerType; ownerIds: string[] }
): Promise<void> => {
  if (owner.ownerIds.length === 0) {
    return;
  }

  const rows = await db
    .select({ id: photos.id, objectKey: photos.objectKey })
    .from(photos)
    .where(
      and(
        eq(photos.householdId, householdId),
        eq(photos.ownerType, owner.ownerType),
        inArray(photos.ownerId, owner.ownerIds)
      )
    );

  await removeRows(env, db, rows);
};

/** Deletes every photo attached to a car's visits and expenses. */
export const deletePhotosOfCar = async (
  env: Bindings,
  db: Db,
  householdId: string,
  carId: string
): Promise<void> => {
  const [visits, expenses] = await Promise.all([
    db
      .select({ id: garageServiceVisits.id })
      .from(garageServiceVisits)
      .where(eq(garageServiceVisits.carId, carId)),
    db
      .select({ id: garageExpenses.id })
      .from(garageExpenses)
      .where(eq(garageExpenses.carId, carId)),
  ]);

  await deletePhotosOfOwners(env, db, householdId, {
    ownerIds: visits.map((row) => row.id),
    ownerType: "service_visit",
  });
  await deletePhotosOfOwners(env, db, householdId, {
    ownerIds: expenses.map((row) => row.id),
    ownerType: "expense",
  });
};

export const deletePhoto = async (
  env: Bindings,
  db: Db,
  householdId: string,
  photoId: string
): Promise<void> => {
  const rows = await db
    .select({
      generated: photos.generated,
      id: photos.id,
      objectKey: photos.objectKey,
    })
    .from(photos)
    .where(and(eq(photos.id, photoId), eq(photos.householdId, householdId)));

  // The PDF an issued invoice was sent as stays; it goes only with the invoice itself.
  if (rows.some((row) => row.generated)) {
    throw conflict("Generated invoice PDFs are kept as sent");
  }

  if (rows.length === 0) {
    throw notFound();
  }

  await removeRows(env, db, rows);
};
