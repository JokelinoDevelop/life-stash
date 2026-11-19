import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  FolderKanban,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { useConfirm } from "@/components/app/confirm/confirm-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFormat } from "@/lib/format";
import { cn } from "@/lib/utils";

import { useFinanceDialog } from "../dialogs/use-finance-dialog";
import {
  projectsQuery,
  useDeleteProject,
  useUpdateProject,
} from "./projects.queries";
import type { ProjectItem } from "./projects.queries";

const ProjectMenu = ({ project }: { project: ProjectItem }) => {
  const { t } = useTranslation("finances");
  const dialog = useFinanceDialog();
  const confirm = useConfirm();
  const update = useUpdateProject();
  const remove = useDeleteProject();
  const done = project.status === "done";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label={t("projects.moreFor", { name: project.name })}
            size="icon-xs"
            variant="ghost"
          />
        }
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => {
            void dialog.open({ dialog: "project", id: project.id });
          }}
        >
          <Pencil />
          {t("projects.rename")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            update.mutate({
              id: project.id,
              json: { status: done ? "active" : "done" },
            });
          }}
        >
          {done ? <RotateCcw /> : <CheckCircle2 />}
          {done ? t("projects.reopen") : t("projects.markDone")}
        </DropdownMenuItem>
        {project.invoiceCount === 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                const ok = await confirm({
                  description: t("projects.deleteDescription"),
                  title: t("projects.deleteTitle", { name: project.name }),
                  tone: "destructive",
                });

                if (ok) {
                  remove.mutate(project.id);
                }
              }}
              variant="destructive"
            >
              <Trash2 />
              {t("projects.delete")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/** A client's projects with what each earned (client detail, F3). */
export const ProjectsSection = ({ clientId }: { clientId: string }) => {
  const { t } = useTranslation("finances");
  const format = useFormat();
  const dialog = useFinanceDialog();
  const projects = useQuery(projectsQuery(clientId));
  const rows = projects.data?.projects ?? [];

  return (
    <section className="flex flex-col gap-2 md:gap-0" data-bleed="">
      <div className="md:bg-background md:border-divider flex items-baseline gap-2 px-0.5 text-sm md:h-8 md:items-center md:border-b md:px-5 md:text-xs">
        <h2 className="text-subtle-foreground font-semibold md:font-medium">
          {t("projects.title")}
        </h2>
        <span className="text-muted-foreground tabular-nums">
          {rows.length}
        </span>
        <Button
          className="ml-auto"
          onClick={() => {
            void dialog.open({ dialog: "project", forClient: clientId });
          }}
          size="xs"
          variant="ghost"
        >
          <Plus />
          {t("projects.add")}
        </Button>
      </div>
      <ul className="bg-card divide-divider md:border-divider divide-y overflow-hidden rounded-lg border md:rounded-none md:border-0 md:border-b">
        {rows.length === 0 && (
          <li className="text-muted-foreground flex min-h-12 items-center px-3.5 text-sm md:px-5">
            {t("projects.empty")}
          </li>
        )}
        {rows.map((project) => (
          <li
            className="flex min-h-12 items-center gap-3 px-3.5 md:min-h-10 md:px-5"
            key={project.id}
          >
            <FolderKanban
              aria-hidden="true"
              className="text-muted-foreground size-4 shrink-0"
            />
            <div className="flex min-w-0 flex-1 flex-col md:flex-row md:items-baseline md:gap-2">
              <span
                className={cn(
                  "truncate font-medium",
                  project.status === "done" && "text-muted-foreground"
                )}
              >
                {project.name}
              </span>
              <span className="text-muted-foreground truncate text-xs md:text-sm">
                {t(`projects.status.${project.status}`)} ·{" "}
                {t("projects.invoices", { count: project.invoiceCount })}
              </span>
            </div>
            <span className="text-right text-sm tabular-nums">
              {t("projects.earned", { amount: format.totals(project.earned) })}
            </span>
            <ProjectMenu project={project} />
          </li>
        ))}
      </ul>
    </section>
  );
};
