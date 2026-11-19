import { and, count, eq, inArray } from "drizzle-orm";

import type { Db } from "../../../core/db";
import { photos } from "../../../db/schema/core";

export type AttachmentOwnerType = "finance_invoice" | "finance_transaction";

/** Counts files attached to finance records (the files themselves live in `photos`). */
export class AttachmentsRepository {
  readonly #db: Db;
  readonly #householdId: string;

  constructor(db: Db, householdId: string) {
    this.#db = db;
    this.#householdId = householdId;
  }

  async countByOwner(
    ownerType: AttachmentOwnerType,
    ownerIds: readonly string[]
  ): Promise<Map<string, number>> {
    if (ownerIds.length === 0) {
      return new Map();
    }

    const rows = await this.#db
      .select({ files: count(), ownerId: photos.ownerId })
      .from(photos)
      .where(
        and(
          eq(photos.householdId, this.#householdId),
          eq(photos.ownerType, ownerType),
          inArray(photos.ownerId, [...ownerIds])
        )
      )
      .groupBy(photos.ownerId);

    return new Map(rows.map((row) => [row.ownerId, row.files]));
  }

  /** When files were first attached, per owner (for the invoice history). */
  async firstAttachedAt(
    ownerType: AttachmentOwnerType,
    ownerId: string
  ): Promise<string | null> {
    const [row] = await this.#db
      .select({ createdAt: photos.createdAt })
      .from(photos)
      .where(
        and(
          eq(photos.householdId, this.#householdId),
          eq(photos.ownerType, ownerType),
          eq(photos.ownerId, ownerId)
        )
      )
      .orderBy(photos.createdAt)
      .limit(1);

    return row?.createdAt ?? null;
  }
}

export type AttachmentsRepositoryPort = Pick<
  AttachmentsRepository,
  "countByOwner" | "firstAttachedAt"
>;
