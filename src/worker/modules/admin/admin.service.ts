import { randomToken, sha256Hex } from "../../core/crypto";
import { domainError, notFound } from "../../core/errors";
import type {
  AccountRow,
  AdminRepositoryPort,
  PendingInviteRow,
} from "./admin.repository";

const DAY_MS = 86_400_000;
export const INVITE_DAYS = 7;

/** The signed-in admin doing the work. */
export interface AdminActor {
  userId: string;
  householdId: string;
}

export interface AccountView extends AccountRow {
  inYourHousehold: boolean;
  isYou: boolean;
}

export interface InviteView extends PendingInviteRow {
  joinsYourHousehold: boolean;
}

export interface CreateInviteInput {
  name: string | null;
  /** The admin decides: join the admin's household, or get a new one of their own. */
  joinMyHousehold: boolean;
}

/** Inviting people and managing accounts. Only admins reach it. */
export class AdminService {
  readonly #repo: AdminRepositoryPort;
  readonly #actor: AdminActor;
  readonly #now: () => Date;

  constructor(
    repo: AdminRepositoryPort,
    actor: AdminActor,
    now: () => Date = () => new Date()
  ) {
    this.#repo = repo;
    this.#actor = actor;
    this.#now = now;
  }

  async listAccounts(): Promise<AccountView[]> {
    const rows = await this.#repo.listAccounts();

    return rows.map((row) => ({
      ...row,
      inYourHousehold: row.householdId === this.#actor.householdId,
      isYou: row.id === this.#actor.userId,
    }));
  }

  async listInvites(): Promise<InviteView[]> {
    const rows = await this.#repo.listPendingInvites(this.#now().toISOString());

    return rows.map((row) => ({
      ...row,
      joinsYourHousehold: row.householdId === this.#actor.householdId,
    }));
  }

  /** Returns the plain token once; only its hash is stored. */
  async createInvite(
    input: CreateInviteInput
  ): Promise<{ id: string; token: string; expiresAt: string }> {
    const token = randomToken();

    const row = await this.#repo.insertInvite({
      createdByUserId: this.#actor.userId,
      expiresAt: new Date(
        this.#now().getTime() + INVITE_DAYS * DAY_MS
      ).toISOString(),
      householdId: input.joinMyHousehold ? this.#actor.householdId : null,
      name: input.name,
      tokenHash: await sha256Hex(token),
    });

    return { expiresAt: row.expiresAt, id: row.id, token };
  }

  async revokeInvite(inviteId: string): Promise<void> {
    if (!(await this.#repo.deletePendingInvite(inviteId))) {
      throw notFound();
    }
  }

  async setDisabled(userId: string, disabled: boolean): Promise<void> {
    await this.#otherAccount(userId);
    await this.#repo.setDisabled(
      userId,
      disabled ? this.#now().toISOString() : null
    );
  }

  /** Lets someone into the admin's household. Their old household and its records stay as they are. */
  async moveToMyHousehold(userId: string): Promise<void> {
    const account = await this.#otherAccount(userId);

    if (account.householdId === this.#actor.householdId) {
      throw domainError("account.already_member");
    }

    await this.#repo.moveToHousehold(userId, this.#actor.householdId);
  }

  async #otherAccount(userId: string) {
    if (userId === this.#actor.userId) {
      throw domainError("account.cannot_change_self", { status: 400 });
    }

    const account = await this.#repo.findAccount(userId);

    if (!account) {
      throw notFound();
    }

    return account;
  }
}
