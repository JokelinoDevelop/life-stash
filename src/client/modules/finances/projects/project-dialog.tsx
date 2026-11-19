import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { FormDialog } from "@/components/app/form-dialog";
import { ErrorState, FormSkeleton } from "@/components/app/states";

import {
  projectFormDefaults,
  projectFormToCreateRequest,
  projectFormToUpdateRequest,
  projectToFormValues,
} from "./forms/project-form/mapper";
import { ProjectForm } from "./forms/project-form/project-form";
import {
  projectsQuery,
  useCreateProject,
  useUpdateProject,
} from "./projects.queries";

type Close = () => Promise<void>;

const ProjectBody = ({
  forClient,
  onClose,
  projectId,
}: {
  forClient: string | undefined;
  onClose: Close;
  projectId: string | undefined;
}) => {
  const projects = useQuery(projectsQuery(null));
  const create = useCreateProject();
  const update = useUpdateProject();

  if (projectId === undefined) {
    return (
      <ProjectForm
        defaultValues={projectFormDefaults()}
        onCancel={() => {
          void onClose();
        }}
        onSubmit={async (values) => {
          await create.mutateAsync(
            projectFormToCreateRequest(values, forClient ?? "")
          );
          await onClose();
        }}
      />
    );
  }

  if (projects.isPending) {
    return <FormSkeleton fields={2} />;
  }

  const project = projects.data?.projects.find((row) => row.id === projectId);

  if (project === undefined) {
    return (
      <ErrorState
        className="m-4 md:m-4"
        error={projects.error}
        onRetry={() => {
          void projects.refetch();
        }}
      />
    );
  }

  return (
    <ProjectForm
      defaultValues={projectToFormValues(project)}
      onCancel={() => {
        void onClose();
      }}
      onSubmit={async (values) => {
        await update.mutateAsync({
          id: project.id,
          json: projectFormToUpdateRequest(values),
        });
        await onClose();
      }}
    />
  );
};

/** `?dialog=project` (+ `forClient` for a new one, `id` to edit). */
export const ProjectDialog = ({
  forClient,
  onClose,
  onOpenChange,
  open,
  projectId,
}: {
  forClient: string | undefined;
  onClose: Close;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  projectId: string | undefined;
}) => {
  const { t } = useTranslation("finances");

  return (
    <FormDialog
      crumb={<span>{t("clients.title")}</span>}
      onOpenChange={onOpenChange}
      open={open}
      title={
        projectId === undefined
          ? t("projects.newTitle")
          : t("projects.editTitle")
      }
    >
      <ProjectBody
        forClient={forClient}
        onClose={onClose}
        projectId={projectId}
      />
    </FormDialog>
  );
};
