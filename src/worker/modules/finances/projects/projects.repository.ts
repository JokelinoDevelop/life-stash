import { and, asc, count, eq } from "drizzle-orm";

import type { Db } from "../../../core/db";
import { financeInvoices, financeProjects } from "../../../db/schema/finances";

export type ProjectRow = typeof financeProjects.$inferSelect;

export type NewProject = Omit<
  typeof financeProjects.$inferInsert,
  "householdId" | "id" | "createdAt" | "updatedAt"
>;

/** Household-scoped access to `finance_projects`. */
export class ProjectsRepository {
  readonly #db: Db;
  readonly #householdId: string;

  constructor(db: Db, householdId: string) {
    this.#db = db;
    this.#householdId = householdId;
  }

  #byId(projectId: string) {
    return and(
      eq(financeProjects.id, projectId),
      eq(financeProjects.householdId, this.#householdId)
    );
  }

  async list(clientId: string | null): Promise<ProjectRow[]> {
    return await this.#db
      .select()
      .from(financeProjects)
      .where(
        clientId === null
          ? eq(financeProjects.householdId, this.#householdId)
          : and(
              eq(financeProjects.householdId, this.#householdId),
              eq(financeProjects.clientId, clientId)
            )
      )
      .orderBy(asc(financeProjects.status), asc(financeProjects.name));
  }

  async findById(projectId: string): Promise<ProjectRow | undefined> {
    const [row] = await this.#db
      .select()
      .from(financeProjects)
      .where(this.#byId(projectId))
      .limit(1);

    return row;
  }

  async insert(values: NewProject): Promise<ProjectRow> {
    const [row] = await this.#db
      .insert(financeProjects)
      .values({ ...values, householdId: this.#householdId })
      .returning();

    if (!row) {
      throw new Error("Project insert returned no row");
    }

    return row;
  }

  async update(projectId: string, patch: Partial<NewProject>): Promise<void> {
    await this.#db
      .update(financeProjects)
      .set(patch)
      .where(this.#byId(projectId));
  }

  async delete(projectId: string): Promise<void> {
    await this.#db.delete(financeProjects).where(this.#byId(projectId));
  }

  /** Invoices (any state) that reference the project. */
  async usage(projectId: string): Promise<number> {
    const [row] = await this.#db
      .select({ rows: count() })
      .from(financeInvoices)
      .where(
        and(
          eq(financeInvoices.householdId, this.#householdId),
          eq(financeInvoices.projectId, projectId)
        )
      );

    return row?.rows ?? 0;
  }
}

export type ProjectsRepositoryPort = Pick<
  ProjectsRepository,
  "list" | "findById" | "insert" | "update" | "delete" | "usage"
>;
