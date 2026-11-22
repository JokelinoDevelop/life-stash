import { sha256Hex } from "../../core/crypto";
import { domainError } from "../../core/errors";
import type { NewAccount } from "../auth/accounts";
import type { AdminRepositoryPort } from "./admin.repository";

export interface AcceptInviteInput {
  displayName: string;
  email: string;
  /** Already hashed by the caller. */
  passwordHash: string;
  timeZone: string;
}

type CreateAccount = (account: NewAccount) => Promise<string[]>;

export type InvitesRepositoryPort = Pick<
  AdminRepositoryPort,
  | "claimInvite"
  | "emailTaken"
  | "findPendingInvite"
  | "markInviteUsedBy"
  | "releaseInvite"
>;

const invalid = () => domainError("account.invite_invalid", { status: 404 });

/** The public side of an invite link: look it up, then accept it once. */
export class InvitesService {
  readonly #repo: InvitesRepositoryPort;
  readonly #createAccount: CreateAccount;
  readonly #now: () => Date;

  constructor(
    repo: InvitesRepositoryPort,
    createAccount: CreateAccount,
    now: () => Date = () => new Date()
  ) {
    this.#repo = repo;
    this.#createAccount = createAccount;
    this.#now = now;
  }

  /** What the invite page may show: only the name it was made for, never the household. */
  async lookup(token: string): Promise<{ name: string | null }> {
    const invite = await this.#repo.findPendingInvite(
      await sha256Hex(token),
      this.#now().toISOString()
    );

    if (!invite) {
      throw invalid();
    }

    return { name: invite.name };
  }

  /**
   * Creates the account in the household the admin chose when inviting (or a new one). The invitee
   * can't pick it. Returns the new user id and their recovery codes.
   */
  async accept(
    token: string,
    input: AcceptInviteInput
  ): Promise<{ userId: string; recoveryCodes: string[] }> {
    const nowIso = this.#now().toISOString();

    const pending = await this.#repo.findPendingInvite(
      await sha256Hex(token),
      nowIso
    );

    if (!pending) {
      throw invalid();
    }

    if (await this.#repo.emailTaken(input.email)) {
      throw domainError("account.email_taken", { field: "email" });
    }

    const invite = await this.#repo.claimInvite(pending.id, nowIso);

    if (!invite) {
      throw invalid();
    }

    const userId = crypto.randomUUID();

    try {
      const recoveryCodes = await this.#createAccount({
        ...input,
        householdId: invite.householdId ?? undefined,
        isAdmin: false,
        userId,
      });

      await this.#repo.markInviteUsedBy(invite.id, userId);

      return { recoveryCodes, userId };
    } catch (error) {
      // Nothing was created (e.g. the email was taken a moment ago): the link works again.
      await this.#repo.releaseInvite(invite.id);

      throw error;
    }
  }
}
