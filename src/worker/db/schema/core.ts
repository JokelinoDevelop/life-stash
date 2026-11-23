import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () =>
  text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString());

export const households = sqliteTable("households", {
  createdAt: createdAt(),
  id: id(),
  name: text("name").notNull(),
});

export const users = sqliteTable("users", {
  createdAt: createdAt(),
  /** Set when an admin turned the account off: no sign-in, no sessions. */
  disabledAt: text("disabled_at"),
  displayName: text("display_name").notNull(),
  /** Lower-cased sign-in email; null for passkey-only accounts. */
  email: text("email").unique(),
  failedLoginCount: integer("failed_login_count").notNull().default(0),
  householdId: text("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  id: id(),
  /** Admins invite people and manage accounts. The first user (setup) is one. */
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  loginLockedUntil: text("login_locked_until"),
  /** `pbkdf2-sha256$<iterations>$<salt>$<hash>`; null when no password is set. */
  passwordHash: text("password_hash"),
});

/**
 * One-time invite links, created by an admin. Only the SHA-256 of the token is stored. The admin
 * picks the household: `householdId` set joins it, null creates a new household on accept.
 */
export const invites = sqliteTable("invites", {
  createdAt: createdAt(),
  createdByUserId: text("created_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: text("expires_at").notNull(),
  householdId: text("household_id").references(() => households.id, {
    onDelete: "cascade",
  }),
  id: id(),
  /** Who it's for (pre-fills their name); optional. */
  name: text("name"),
  tokenHash: text("token_hash").notNull().unique(),
  usedAt: text("used_at"),
  usedByUserId: text("used_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
});

export const userPreferences = sqliteTable("user_preferences", {
  currency: text("currency", { enum: ["MKD", "EUR", "USD"] })
    .notNull()
    .default("MKD"),
  distanceUnit: text("distance_unit", { enum: ["km", "mi"] })
    .notNull()
    .default("km"),
  locale: text("locale", { enum: ["en", "mk"] })
    .notNull()
    .default("en"),
  odometerNudgeWeeks: integer("odometer_nudge_weeks").notNull().default(4),
  timeZone: text("time_zone").notNull().default("Europe/Skopje"),
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const passkeys = sqliteTable(
  "passkeys",
  {
    counter: integer("counter").notNull().default(0),
    createdAt: createdAt(),
    deviceName: text("device_name").notNull(),
    id: text("id").primaryKey(),
    lastUsedAt: text("last_used_at"),
    publicKey: text("public_key").notNull(),
    transports: text("transports"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [index("passkeys_user_idx").on(table.userId)]
);

export const sessions = sqliteTable(
  "sessions",
  {
    createdAt: createdAt(),
    expiresAt: text("expires_at").notNull(),
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [index("sessions_user_idx").on(table.userId)]
);

export const authChallenges = sqliteTable("auth_challenges", {
  challenge: text("challenge").notNull(),
  expiresAt: text("expires_at").notNull(),
  id: id(),
  purpose: text("purpose", {
    enum: ["register", "login", "add-passkey"],
  }).notNull(),
  userId: text("user_id"),
});

export const recoveryCodes = sqliteTable(
  "recovery_codes",
  {
    codeHash: text("code_hash").notNull().unique(),
    id: id(),
    usedAt: text("used_at"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [index("recovery_codes_user_idx").on(table.userId)]
);

export const pushSubscriptions = sqliteTable(
  "push_subscriptions",
  {
    auth: text("auth").notNull(),
    createdAt: createdAt(),
    endpoint: text("endpoint").notNull().unique(),
    id: id(),
    p256dh: text("p256dh").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [index("push_subscriptions_user_idx").on(table.userId)]
);

export const photos = sqliteTable(
  "photos",
  {
    contentType: text("content_type").notNull(),
    createdAt: createdAt(),
    /** Original file name, shown for documents (invoice PDFs, receipts). */
    fileName: text("file_name"),
    /** An invoice PDF the app generated when issuing (kept as sent, not removable). */
    generated: integer("generated", { mode: "boolean" })
      .notNull()
      .default(false),
    householdId: text("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    id: id(),
    objectKey: text("object_key").notNull().unique(),
    ownerId: text("owner_id").notNull(),
    ownerType: text("owner_type", {
      enum: [
        "car",
        "service_visit",
        "expense",
        "finance_invoice",
        "finance_transaction",
      ],
    }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
  },
  (table) => [index("photos_owner_idx").on(table.ownerType, table.ownerId)]
);
