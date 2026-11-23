/** Central query keys so invalidation stays consistent across modules. */
export const queryKeys = {
  admin: ["admin"] as const,
  adminInvites: ["admin", "invites"] as const,
  adminUsers: ["admin", "users"] as const,
  authStatus: ["auth", "status"] as const,
  config: ["config"] as const,
  credentials: ["account", "credentials"] as const,
  garage: ["garage"] as const,
  passkeys: ["account", "passkeys"] as const,
  preferences: ["settings", "preferences"] as const,
  recoveryCodes: ["account", "recovery-codes"] as const,
};
