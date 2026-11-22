import { and, asc, desc, eq, gt, isNull } from "drizzle-orm";

import type { Db } from "../../core/db";
import { households, invites, sessions, users } from "../../db/schema/core";

export type InviteRow = typeof invites.$inferSelect;

export type NewInvite = Pick<
  typeof invites.$inferInsert,
  "createdByUserId" | "expiresAt" | "householdId" | "name" | "tokenHash"
>;

export interface AccountRow {
  id: string;
  displayName: string;
  email: string | null;
  householdId: string;
  householdName: string;
  isAdmin: boolean;
  disabledAt: string | null;
  createdAt: string;
}

export interface PendingInviteRow {
  id: string;
  name: string | null;
  householdId: string | null;
  expiresAt: string;
  createdAt: string;
}

/**
 * Accounts and invites across every household. Unlike feature repositories this is **not**
 * household-scoped on purpose: only admins reach it (`requireAdmin`), and accepting an invite
 * happens before there is a household.
 */
export class AdminRepository {
  readonly #db: Db;

  constructor(db: Db) {
    this.#db = db;
  }

  async listAccounts(): Promise<AccountRow[]> {
    return await this.#db
      .select({
        createdAt: users.createdAt,
        disabledAt: users.disabledAt,
        displayName: users.displayName,
        email: users.email,
        householdId: users.householdId,
        householdName: households.name,
        id: users.id,
        isAdmin: users.isAdmin,
      })
      .from(users)
      .innerJoin(households, eq(households.id, users.householdId))
      .orderBy(asc(users.createdAt));
  }

  async findAccount(
    userId: string
  ): Promise<{ id: string; householdId: string } | undefined> {
    const [row] = await this.#db
      .select({ householdId: users.householdId, id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return row;
  }

  async emailTaken(email: string): Promise<boolean> {
    const [row] = await this.#db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return row !== undefined;
  }

  /** Turns an account off (and ends its sessions) or back on. */
  async setDisabled(userId: string, disabledAt: string | null): Promise<void> {
    const update = this.#db
      .update(users)
      .set({ disabledAt })
      .where(eq(users.id, userId));

    await (disabledAt === null
      ? update
      : this.#db.batch([
          update,
          this.#db.delete(sessions).where(eq(sessions.userId, userId)),
        ]));
  }

  async moveToHousehold(userId: string, householdId: string): Promise<void> {
    await this.#db
      .update(users)
      .set({ householdId })
      .where(eq(users.id, userId));
  }

  async listPendingInvites(nowIso: string): Promise<PendingInviteRow[]> {
    return await this.#db
      .select({
        createdAt: invites.createdAt,
        expiresAt: invites.expiresAt,
        householdId: invites.householdId,
        id: invites.id,
        name: invites.name,
      })
      .from(invites)
      .where(and(isNull(invites.usedAt), gt(invites.expiresAt, nowIso)))
      .orderBy(desc(invites.createdAt));
  }

  async insertInvite(invite: NewInvite): Promise<InviteRow> {
    const [row] = await this.#db.insert(invites).values(invite).returning();

    if (!row) {
      throw new Error("Invite insert returned no row");
    }

    return row;
  }

  /** Deletes an unused invite; returns whether one was removed. */
  async deletePendingInvite(inviteId: string): Promise<boolean> {
    const deleted = await this.#db
      .delete(invites)
      .where(and(eq(invites.id, inviteId), isNull(invites.usedAt)))
      .returning({ id: invites.id });

    return deleted.length > 0;
  }

  async findPendingInvite(
    tokenHash: string,
    nowIso: string
  ): Promise<InviteRow | undefined> {
    const [row] = await this.#db
      .select()
      .from(invites)
      .where(
        and(
          eq(invites.tokenHash, tokenHash),
          isNull(invites.usedAt),
          gt(invites.expiresAt, nowIso)
        )
      )
      .limit(1);

    return row;
  }

  /**
   * Marks a pending invite used in one statement, so two people opening the same link can't both
   * claim it. Returns the invite, or undefined when it was used, revoked or expired meanwhile.
   */
  async claimInvite(
    inviteId: string,
    nowIso: string
  ): Promise<InviteRow | undefined> {
    const [row] = await this.#db
      .update(invites)
      .set({ usedAt: nowIso })
      .where(
        and(
          eq(invites.id, inviteId),
          isNull(invites.usedAt),
          gt(invites.expiresAt, nowIso)
        )
      )
      .returning();

    return row;
  }

  async releaseInvite(inviteId: string): Promise<void> {
    await this.#db
      .update(invites)
      .set({ usedAt: null })
      .where(eq(invites.id, inviteId));
  }

  async markInviteUsedBy(inviteId: string, userId: string): Promise<void> {
    await this.#db
      .update(invites)
      .set({ usedByUserId: userId })
      .where(eq(invites.id, inviteId));
  }
}

export type AdminRepositoryPort = Pick<
  AdminRepository,
  | "claimInvite"
  | "deletePendingInvite"
  | "emailTaken"
  | "findAccount"
  | "findPendingInvite"
  | "insertInvite"
  | "listAccounts"
  | "listPendingInvites"
  | "markInviteUsedBy"
  | "moveToHousehold"
  | "releaseInvite"
  | "setDisabled"
>;
