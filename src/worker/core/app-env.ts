import type { Container } from "./container";
import type { Db } from "./db";
import type { Bindings } from "./env";

export interface AuthContext {
  /** The sessions row id (hash of the cookie token). */
  sessionId: string;
  userId: string;
  householdId: string;
  /** When this session was created; recent sign-ins may change credentials without re-entry. */
  sessionCreatedAt: string;
}

export interface PublicEnv {
  Bindings: Bindings;
  Variables: { db: Db };
}

export interface AppEnv {
  Bindings: Bindings;
  Variables: { db: Db; auth: AuthContext; container: Container };
}
