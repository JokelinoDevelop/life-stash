import { describe, expect, it } from "vitest";

import { sha256Hex } from "../../core/crypto";
import { ApiError } from "../../core/errors";
import type { NewAccount } from "../auth/accounts";
import type {
  AccountRow,
  AdminRepositoryPort,
  InviteRow,
} from "./admin.repository";
import { AdminService } from "./admin.service";
import { InvitesService } from "./invites.service";

const NOW = new Date("2026-11-22T10:00:00Z");
const ADMIN = { householdId: "home", userId: "admin" };

interface Fake extends AdminRepositoryPort {
  accounts: AccountRow[];
  invites: InviteRow[];
}

// oxlint-disable-next-line sonarjs/shorthand-property-grouping -- conflicts with sort-keys
const account = (id: string, householdId: string): AccountRow => ({
  createdAt: NOW.toISOString(),
  disabledAt: null,
  displayName: id,
  email: `${id}@example.com`,
  householdId,
  householdName: "Home",
  id,
  isAdmin: id === ADMIN.userId,
});

const fakeRepo = (): Fake => {
  const fake: Fake = {
    accounts: [account("admin", "home"), account("guest", "elsewhere")],
    claimInvite: async (id, nowIso) => {
      const row = fake.invites.find(
        (invite) =>
          invite.id === id &&
          invite.usedAt === null &&
          invite.expiresAt > nowIso
      );

      if (row) {
        row.usedAt = nowIso;
      }

      return await Promise.resolve(row);
    },
    deletePendingInvite: async (id) => {
      const before = fake.invites.length;
      fake.invites = fake.invites.filter(
        (invite) => !(invite.id === id && invite.usedAt === null)
      );

      return await Promise.resolve(fake.invites.length < before);
    },
    emailTaken: async (email) =>
      await Promise.resolve(fake.accounts.some((row) => row.email === email)),
    findAccount: async (id) =>
      await Promise.resolve(fake.accounts.find((row) => row.id === id)),
    findPendingInvite: async (hash, nowIso) =>
      await Promise.resolve(
        fake.invites.find(
          (invite) =>
            invite.tokenHash === hash &&
            invite.usedAt === null &&
            invite.expiresAt > nowIso
        )
      ),
    insertInvite: async (input) => {
      const row: InviteRow = {
        ...input,
        createdAt: NOW.toISOString(),
        householdId: input.householdId ?? null,
        id: crypto.randomUUID(),
        name: input.name ?? null,
        usedAt: null,
        usedByUserId: null,
      };

      fake.invites.push(row);

      return await Promise.resolve(row);
    },
    invites: [],
    listAccounts: async () => await Promise.resolve(fake.accounts),
    listPendingInvites: async () => await Promise.resolve(fake.invites),
    markInviteUsedBy: async (id, userId) => {
      const row = fake.invites.find((invite) => invite.id === id);

      if (row) {
        row.usedByUserId = userId;
      }

      await Promise.resolve();
    },
    moveToHousehold: async (id, householdId) => {
      const row = fake.accounts.find((item) => item.id === id);

      if (row) {
        row.householdId = householdId;
      }

      await Promise.resolve();
    },
    releaseInvite: async (id) => {
      const row = fake.invites.find((invite) => invite.id === id);

      if (row) {
        row.usedAt = null;
      }

      await Promise.resolve();
    },
    setDisabled: async (id, disabledAt) => {
      const row = fake.accounts.find((item) => item.id === id);

      if (row) {
        row.disabledAt = disabledAt;
      }

      await Promise.resolve();
    },
  };

  return fake;
};

const codeOf = async (promise: Promise<unknown>): Promise<string> => {
  try {
    await promise;
  } catch (error) {
    return error instanceof ApiError ? error.code : "unexpected";
  }

  return "none";
};

const INPUT = {
  displayName: "Ana",
  email: "ana@example.com",
  passwordHash: "hash",
  timeZone: "Europe/Skopje",
};

describe(AdminService, () => {
  it("stores only the token's hash and the household the admin chose", async () => {
    const repo = fakeRepo();
    const service = new AdminService(repo, ADMIN, () => NOW);

    const own = await service.createInvite({
      joinMyHousehold: false,
      name: null,
    });

    const shared = await service.createInvite({
      joinMyHousehold: true,
      name: "Ana",
    });

    const [ownRow, sharedRow] = repo.invites;
    expect(ownRow?.tokenHash).toBe(await sha256Hex(own.token));
    expect(sharedRow?.tokenHash).toBe(await sha256Hex(shared.token));
    expect([ownRow?.householdId, sharedRow?.householdId]).toStrictEqual([
      null,
      "home",
    ]);
    expect(own.expiresAt).toBe("2026-11-29T10:00:00.000Z");
  });

  it("refuses to disable or move the admin's own account", async () => {
    const service = new AdminService(fakeRepo(), ADMIN, () => NOW);

    await expect(codeOf(service.setDisabled("admin", true))).resolves.toBe(
      "account.cannot_change_self"
    );
    await expect(codeOf(service.moveToMyHousehold("admin"))).resolves.toBe(
      "account.cannot_change_self"
    );
  });

  it("moves someone into the admin's household once", async () => {
    const repo = fakeRepo();
    const service = new AdminService(repo, ADMIN, () => NOW);

    await service.moveToMyHousehold("guest");

    expect(repo.accounts.find((row) => row.id === "guest")?.householdId).toBe(
      "home"
    );
    await expect(codeOf(service.moveToMyHousehold("guest"))).resolves.toBe(
      "account.already_member"
    );
    await expect(codeOf(service.moveToMyHousehold("nobody"))).resolves.toBe(
      "not_found"
    );
  });

  it("disables and re-enables an account", async () => {
    const repo = fakeRepo();
    const service = new AdminService(repo, ADMIN, () => NOW);

    await service.setDisabled("guest", true);
    expect(repo.accounts[1]?.disabledAt).toBe(NOW.toISOString());

    await service.setDisabled("guest", false);
    expect(repo.accounts[1]?.disabledAt).toBeNull();
  });
});

const setup = async (joinMyHousehold: boolean) => {
  const repo = fakeRepo();
  const created: NewAccount[] = [];

  const { token } = await new AdminService(repo, ADMIN, () => NOW).createInvite(
    { joinMyHousehold, name: "Ana" }
  );

  const invites = new InvitesService(
    repo,
    async (newAccount) => {
      created.push(newAccount);

      return await Promise.resolve(["CODE"]);
    },
    () => NOW
  );

  return { created, invites, repo, token };
};

describe(InvitesService, () => {
  it("creates the account in the household picked when inviting, as a non-admin", async () => {
    const own = await setup(false);
    await own.invites.accept(own.token, INPUT);
    expect(own.created[0]?.householdId).toBeUndefined();
    expect(own.created[0]?.isAdmin).toBeFalsy();

    const shared = await setup(true);
    await shared.invites.accept(shared.token, INPUT);
    expect(shared.created[0]?.householdId).toBe("home");
  });

  it("works once, and not after it expires", async () => {
    const { invites, token } = await setup(false);

    await expect(invites.lookup(token)).resolves.toStrictEqual({ name: "Ana" });
    await invites.accept(token, INPUT);

    await expect(codeOf(invites.accept(token, INPUT))).resolves.toBe(
      "account.invite_invalid"
    );
    await expect(codeOf(invites.lookup("not-a-real-token"))).resolves.toBe(
      "account.invite_invalid"
    );

    const later = await setup(false);

    const expired = new InvitesService(
      later.repo,
      async () => await Promise.resolve([]),
      () => new Date("2026-12-01T00:00:00Z")
    );

    await expect(codeOf(expired.lookup(later.token))).resolves.toBe(
      "account.invite_invalid"
    );
  });

  it("keeps the link usable when the email is taken or creation fails", async () => {
    const { invites, repo, token } = await setup(false);

    await expect(
      codeOf(invites.accept(token, { ...INPUT, email: "guest@example.com" }))
    ).resolves.toBe("account.email_taken");

    const failing = new InvitesService(
      repo,
      async () => await Promise.reject(new Error("boom")),
      () => NOW
    );

    await expect(codeOf(failing.accept(token, INPUT))).resolves.toBe(
      "unexpected"
    );

    expect(repo.invites[0]?.usedAt).toBeNull();
    await expect(invites.lookup(token)).resolves.toStrictEqual({ name: "Ana" });
  });
});
