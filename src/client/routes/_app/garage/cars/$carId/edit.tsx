import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { BackLink } from "@/components/app/back-link";
import { PageContent, PageHeader } from "@/components/app/page-header";
import { api, unwrap } from "@/lib/api";
import { useErrorMessage } from "@/lib/errors";
import { useFormat } from "@/lib/format";
import { todayIso } from "@/lib/partial-date";
import {
  carQuery,
  useInvalidateGarage,
} from "@/modules/garage/cars/cars.queries";
import { CarForm } from "@/modules/garage/cars/forms/car-form/car-form";
import {
  carFormToRequest,
  carToFormValues,
} from "@/modules/garage/cars/forms/car-form/mapper";

const EditCarPage = () => {
  const { carId } = Route.useParams();
  const { t } = useTranslation("garage");
  const navigate = useNavigate();
  const format = useFormat();
  const errorMessage = useErrorMessage();
  const invalidate = useInvalidateGarage();
  const { data } = useSuspenseQuery(carQuery(carId));

  return (
    <>
      <PageHeader
        back={
          <BackLink
            params={{ carId }}
            search={{ tab: "details" }}
            to="/garage/cars/$carId"
          />
        }
        title={t("carForm.editTitle")}
      />
      <PageContent>
        <CarForm
          defaultValues={carToFormValues(data, {
            currency: format.currency,
            today: todayIso(),
            unit: format.unit,
          })}
          onSubmit={async (values) => {
            try {
              await unwrap(
                api.garage.cars[":carId"].$put({
                  json: carFormToRequest(values, format.unit),
                  param: { carId },
                })
              );
              await invalidate();
              toast.success(t("carForm.updated"));
              await navigate({
                params: { carId },
                search: { tab: "details" },
                to: "/garage/cars/$carId",
              });
            } catch (error) {
              toast.error(errorMessage(error));
            }
          }}
        />
      </PageContent>
    </>
  );
};

export const Route = createFileRoute("/_app/garage/cars/$carId/edit")({
  component: EditCarPage,
  loader: async ({ context, params }) => {
    await context.queryClient.query(carQuery(params.carId));
  },
});
