/**
 * Test-only: a D1Database backed by Node's built-in SQLite, with the repo's migrations
 * applied, so controller and repository tests run real SQL without workerd.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { SQLInputValue, StatementSync } from "node:sqlite";

const MIGRATIONS_DIR = path.resolve(import.meta.dirname, "../../../migrations");

type Value = SQLInputValue;

const normalise = (values: unknown[]): Value[] =>
  values.map((value) => {
    if (typeof value === "boolean") {
      return value ? 1 : 0;
    }

    if (value === undefined) {
      return null;
    }

    // SAFETY: drizzle only binds primitives (string, number, bigint, null, Uint8Array).
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return value as Value;
  });

const isReader = (statement: StatementSync, sql: string): boolean =>
  statement.columns().length > 0 || /\breturning\b/iu.test(sql);

class Statement {
  readonly #db: DatabaseSync;
  readonly #sql: string;
  readonly #params: Value[];

  constructor(db: DatabaseSync, sql: string, params: Value[] = []) {
    this.#db = db;
    this.#sql = sql;
    this.#params = params;
  }

  bind(...values: unknown[]): Statement {
    return new Statement(this.#db, this.#sql, normalise(values));
  }

  runSync(): { results: Record<string, unknown>[]; meta: { changes: number } } {
    const statement = this.#db.prepare(this.#sql);

    if (isReader(statement, this.#sql)) {
      const results = statement.all(...this.#params);

      return { meta: { changes: 0 }, results };
    }

    const info = statement.run(...this.#params);

    return { meta: { changes: Number(info.changes) }, results: [] };
  }

  async all() {
    return await Promise.resolve({ ...this.runSync(), success: true });
  }

  async run() {
    return await Promise.resolve({ ...this.runSync(), success: true });
  }

  async first(column?: string) {
    const [row] = this.runSync().results;

    if (row === undefined) {
      return await Promise.resolve(null);
    }

    return await Promise.resolve(column === undefined ? row : row[column]);
  }

  async raw() {
    const statement = this.#db.prepare(this.#sql);
    statement.setReturnArrays(true);

    // SAFETY: with setReturnArrays(true) each row is an array of column values.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return await Promise.resolve(
      statement.all(...this.#params) as unknown as unknown[][]
    );
  }
}

export interface TestD1 {
  d1: D1Database;
  sqlite: DatabaseSync;
}

/** A fresh in-memory database with every migration applied. */
export const createTestD1 = (): TestD1 => {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON;");

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .toSorted();

  for (const file of files) {
    const text = readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");

    for (const statement of text.split("--> statement-breakpoint")) {
      if (statement.trim() !== "") {
        sqlite.exec(statement);
      }
    }
  }

  const d1 = {
    batch: async (statements: Statement[]) => {
      sqlite.exec("BEGIN");

      try {
        const results = statements.map((statement) => ({
          ...statement.runSync(),
          success: true,
        }));

        sqlite.exec("COMMIT");

        return await Promise.resolve(results);
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
    exec: async (sql: string) => {
      sqlite.exec(sql);

      return await Promise.resolve({ count: 0, duration: 0 });
    },
    prepare: (sql: string) => new Statement(sqlite, sql),
  };

  // SAFETY: implements the subset of D1Database that drizzle's d1 driver calls.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return { d1: d1 as unknown as D1Database, sqlite };
};
