import { Link, useNavigate } from "@tanstack/react-router";
import { Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, unwrap } from "@/lib/api";
import { useErrorMessage } from "@/lib/errors";
import { useFormat } from "@/lib/format";

import { PhotoGallery } from "../../photos/photo-gallery";
import { useInvalidateGarage } from "../cars/cars.queries";
import type { VisitDetail as Visit } from "./visits.queries";

export const VisitActions = ({ visit }: { visit: Visit }) => {
  const { t } = useTranslation("garageVisits");
  const { t: tc } = useTranslation();
  const navigate = useNavigate();
  const invalidate = useInvalidateGarage();
  const errorMessage = useErrorMessage();

  return (
    <div className="flex gap-2">
      <Button asChild variant="outline">
        <Link
          params={{ carId: visit.carId, visitId: visit.id }}
          to="/garage/cars/$carId/services/$visitId/edit"
        >
          <Pencil />
          {tc("actions.edit")}
        </Link>
      </Button>
      <ConfirmDialog
        onConfirm={async () => {
          try {
            await unwrap(
              api.garage.visits[":visitId"].$delete({
                param: { visitId: visit.id },
              })
            );
            await invalidate();
            toast.success(t("detail.deleted"));
            await navigate({
              params: { carId: visit.carId },
              search: { tab: "history" },
              to: "/garage/cars/$carId",
            });
          } catch (error) {
            toast.error(errorMessage(error));
          }
        }}
        title={t("detail.deleteTitle")}
        trigger={
          <Button
            aria-label={tc("actions.delete")}
            size="icon"
            variant="outline"
          >
            <Trash2 />
          </Button>
        }
      />
    </div>
  );
};

export const VisitDetail = ({
  visit,
  readOnly,
}: {
  visit: Visit;
  readOnly: boolean;
}) => {
  const { t } = useTranslation("garageVisits");
  const { t: tc } = useTranslation();
  const format = useFormat();

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t("detail.items")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{t(`kinds.${visit.kind}`)}</Badge>
              {visit.byPreviousOwner && (
                <Badge variant="secondary">{t("history.previousOwner")}</Badge>
              )}
              {visit.odometerKm !== null && (
                <Badge variant="outline">
                  {format.distance(visit.odometerKm)}
                </Badge>
              )}
            </div>
            <ul className="flex flex-col divide-y">
              {visit.items.map((item) => (
                <li className="flex justify-between gap-3 py-2" key={item.id}>
                  <span>{item.label}</span>
                  {item.costMinor !== null && (
                    <span className="tabular-nums">
                      {format.money(item.costMinor, visit.currency)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>{t("detail.total")}</span>
              <span className="tabular-nums">
                {visit.effectiveTotalMinor === null
                  ? t("detail.noTotal")
                  : format.money(visit.effectiveTotalMinor, visit.currency)}
              </span>
            </div>
            {visit.shop !== null && (
              <p className="text-sm">
                <span className="text-muted-foreground">
                  {t("detail.shop")}:{" "}
                </span>
                {visit.shop}
              </p>
            )}
            {visit.notes !== null && (
              <p className="text-sm whitespace-pre-wrap">
                <span className="text-muted-foreground">
                  {tc("fields.notes")}:{" "}
                </span>
                {visit.notes}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("photos.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <PhotoGallery
            owner={{ ownerId: visit.id, ownerType: "service_visit" }}
            readOnly={readOnly}
          />
        </CardContent>
      </Card>
    </div>
  );
};
