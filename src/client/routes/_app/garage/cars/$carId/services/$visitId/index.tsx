import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { BackLink } from "@/components/app/back-link";
import { PageContent, PageHeader } from "@/components/app/page-header";
import { useFormat } from "@/lib/format";
import { cached } from "@/lib/warm";
import { carQuery } from "@/modules/garage/cars/cars.queries";
import {
  VisitActions,
  VisitDetail,
} from "@/modules/garage/visits/visit-detail";
import { visitQuery } from "@/modules/garage/visits/visits.queries";

const VisitPage = () => {
  const { carId, visitId } = Route.useParams();
  const { t } = useTranslation("garageVisits");
  const format = useFormat();
  const { data } = useSuspenseQuery(visitQuery(visitId));
  const { data: carData } = useSuspenseQuery(carQuery(carId));
  const readOnly = carData.car.archivedAt !== null;
  const { visit } = data;

  return (
    <>
      <PageHeader
        actions={readOnly ? undefined : <VisitActions visit={visit} />}
        back={
          <BackLink
            label={carData.car.name}
            params={{ carId }}
            search={{ tab: "timeline" }}
            to="/garage/cars/$carId"
          />
        }
        description={carData.car.name}
        title={`${t("detail.title")} · ${format.date(visit.date, visit.datePrecision)}`}
      />
      <PageContent>
        <VisitDetail readOnly={readOnly} visit={visit} />
      </PageContent>
    </>
  );
};

export const Route = createFileRoute(
  "/_app/garage/cars/$carId/services/$visitId/"
)({
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.query(cached(visitQuery(params.visitId))),
      context.queryClient.query(cached(carQuery(params.carId))),
    ]);
  },
  component: VisitPage,
});
