import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { BackLink } from "@/components/app/back-link";
import { PageHeader } from "@/components/app/page-header";
import { api, unwrap } from "@/lib/api";
import { useErrorMessage } from "@/lib/errors";
import { useFormat } from "@/lib/format";
import { useInvalidateGarage } from "@/modules/garage/cars/cars.queries";
import {
  visitFormToUpdateRequest,
  visitToFormValues,
} from "@/modules/garage/visits/forms/visit-form/mapper";
import { VisitForm } from "@/modules/garage/visits/forms/visit-form/visit-form";
import { visitQuery } from "@/modules/garage/visits/visits.queries";

const EditVisitPage = () => {
  const { carId, visitId } = Route.useParams();
  const { t } = useTranslation("garageVisits");
  const navigate = useNavigate();
  const { unit } = useFormat();
  const errorMessage = useErrorMessage();
  const invalidate = useInvalidateGarage();
  const { data } = useSuspenseQuery(visitQuery(visitId));

  return (
    <>
      <PageHeader
        back={
          <BackLink
            params={{ carId, visitId }}
            to="/garage/cars/$carId/services/$visitId"
          />
        }
        title={t("form.editTitle")}
      />
      <VisitForm
        defaultValues={visitToFormValues(data.visit, unit)}
        onSubmit={async (values) => {
          try {
            await unwrap(
              api.garage.visits[":visitId"].$put({
                json: visitFormToUpdateRequest(values, unit),
                param: { visitId },
              })
            );
            await invalidate();
            toast.success(t("form.updated"));
            await navigate({
              params: { carId, visitId },
              to: "/garage/cars/$carId/services/$visitId",
            });
          } catch (error) {
            toast.error(errorMessage(error));
          }
        }}
        showPhotosHint={false}
      />
    </>
  );
};

export const Route = createFileRoute(
  "/_app/garage/cars/$carId/services/$visitId/edit"
)({
  loader: async ({ context, params }) => {
    await context.queryClient.query(visitQuery(params.visitId));
  },
  component: EditVisitPage,
});
