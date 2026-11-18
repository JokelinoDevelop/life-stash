import type { Db } from "./db";
import type { Bindings } from "./env";

export interface AuthContext {
  userId: string;
  householdId: string;
}

export interface PublicEnv {
  Bindings: Bindings;
  Variables: { db: Db };
}

export interface AppEnv {
  Bindings: Bindings;
  Variables: { db: Db; auth: AuthContext };
}
