import { eq } from "drizzle-orm";

import { randomToken, sha256Hex } from "../../../core/crypto";
import { households, invites, userPreferences, users } from "../../schema/core";
import { DEMO_ACCOUNT } from "../fixtures/account";
import { DEMO_PEOPLE } from "../fixtures/people";
import type { Seeder } from "../seeder";

const DAY_MS = 86_400_000;
const INVITE_DAYS = 7;

/**
 * A household member, someone with their own household, and two pending invites (their links
 * aren't usable: the tokens are thrown away, as the real app only keeps hashes).
 */
export const peopleSeeder: Seeder = {
  name: "people",
  run: async (ctx) => {
    const { db } = ctx;
    const { member, separate } = DEMO_PEOPLE;

    const [admin] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, DEMO_ACCOUNT.email))
      .limit(1);

    if (!admin) {
      throw new Error("The demo account must be seeded first");
    }

    // The separate household outlives a re-seed of the demo household: replace it.
    const [previous] = await db
      .select({ householdId: users.householdId })
      .from(users)
      .where(eq(users.email, separate.email))
      .limit(1);

    if (previous) {
      await db
        .delete(households)
        .where(eq(households.id, previous.householdId));
    }

    const memberId = crypto.randomUUID();
    const separateId = crypto.randomUUID();
    const separateHouseholdId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + INVITE_DAYS * DAY_MS).toISOString();

    const inviteRows = await Promise.all(
      // oxlint-disable-next-line sonarjs/shorthand-property-grouping -- conflicts with sort-keys
      DEMO_PEOPLE.invites.map(async (invite) => ({
        createdByUserId: admin.id,
        expiresAt,
        householdId: invite.joinDemoHousehold ? ctx.householdId : null,
        name: invite.name,
        tokenHash: await sha256Hex(randomToken()),
      }))
    );

    await db.batch([
      db.insert(users).values({
        displayName: member.displayName,
        email: member.email,
        householdId: ctx.householdId,
        id: memberId,
      }),
      db.insert(userPreferences).values({ userId: memberId }),
      db
        .insert(households)
        .values({ id: separateHouseholdId, name: separate.householdName }),
      db.insert(users).values({
        displayName: separate.displayName,
        email: separate.email,
        householdId: separateHouseholdId,
        id: separateId,
      }),
      db.insert(userPreferences).values({ userId: separateId }),
      db.insert(invites).values(inviteRows),
    ]);

    return { invites: inviteRows.length, people: 2 };
  },
};
