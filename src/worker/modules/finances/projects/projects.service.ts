import { sumByCurrency } from "@shared/domain/money";
import type { MoneyTotal } from "@shared/domain/money";

import { domainError, notFound } from "../../../core/errors";
import type { ClientsService } from "../clients/clients.service";
import type { InvoicesRepositoryPort } from "../invoices/invoices.repository";
import type {
  NewProject,
  ProjectRow,
  ProjectsRepositoryPort,
} from "./projects.repository";

export interface ProjectSummary extends ProjectRow {
  invoiceCount: number;
  /** Everything invoiced (sent or paid). */
  invoiced: MoneyTotal[];
  /** What the project earned: paid invoices. */
  earned: MoneyTotal[];
}

/** Optional grouping of a client's invoices, to see what a project earned in total. */
export class ProjectsService {
  readonly #repo: ProjectsRepositoryPort;
  readonly #invoices: Pick<InvoicesRepositoryPort, "list">;
  readonly #clients: Pick<ClientsService, "requireForEntry">;

  constructor(deps: {
    repo: ProjectsRepositoryPort;
    invoices: Pick<InvoicesRepositoryPort, "list">;
    clients: Pick<ClientsService, "requireForEntry">;
  }) {
    this.#repo = deps.repo;
    this.#invoices = deps.invoices;
    this.#clients = deps.clients;
  }

  async list(clientId: string | null): Promise<ProjectSummary[]> {
    const [projects, invoices] = await Promise.all([
      this.#repo.list(clientId),
      this.#invoices.list(clientId === null ? {} : { clientId }),
    ]);

    return projects.map((project) => {
      const own = invoices.filter(
        (invoice) => invoice.projectId === project.id
      );

      return {
        ...project,
        earned: sumByCurrency(
          own.filter((invoice) => invoice.status === "paid")
        ),
        invoiceCount: own.length,
        invoiced: sumByCurrency(
          own.filter(
            (invoice) => invoice.status === "sent" || invoice.status === "paid"
          )
        ),
      };
    });
  }

  async get(projectId: string): Promise<ProjectRow> {
    const row = await this.#repo.findById(projectId);

    if (!row) {
      throw notFound();
    }

    return row;
  }

  /** A project an invoice may use: it must belong to the invoice's client. */
  async requireForInvoice(
    projectId: string,
    clientId: string
  ): Promise<ProjectRow> {
    const project = await this.get(projectId);

    if (project.clientId !== clientId) {
      throw domainError("finances.project_client_mismatch", {
        field: "projectId",
        status: 400,
      });
    }

    return project;
  }

  async create(
    input: Omit<NewProject, "status"> & { status?: "active" | "done" }
  ): Promise<ProjectRow> {
    await this.#clients.requireForEntry(input.clientId);

    return await this.#repo.insert(input);
  }

  async update(
    projectId: string,
    changes: Partial<Pick<NewProject, "name" | "notes" | "status">>
  ) {
    await this.get(projectId);
    await this.#repo.update(projectId, changes);
  }

  async delete(projectId: string): Promise<void> {
    await this.get(projectId);

    if ((await this.#repo.usage(projectId)) > 0) {
      throw domainError("finances.project_in_use");
    }

    await this.#repo.delete(projectId);
  }
}
