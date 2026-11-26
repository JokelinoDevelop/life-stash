import { useNavigate } from "@tanstack/react-router";
import { CalendarDays, Gauge, Pencil, Store, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { Panel } from "@/components/app/list-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, unwrap } from "@/lib/api";
import { useErrorMessage } from "@/lib/errors";
import { useFormat } from "@/lib/format";
import { cn } from "@/lib/utils";

import { PhotoGallery } from "../../photos/photo-gallery";
import { useInvalidateGarage } from "../cars/cars.queries";
import { EntryDialogLink } from "../entry-dialogs/entry-dialog-link";
import type { VisitDetail as Visit } from "./visits.queries";

export const VisitActions = ({ visit }: { visit: Visit }) => {
  const { t } = useTranslation("garageVisits");
  const { t: tc } = useTranslation();
  const navigate = useNavigate();
  const invalidate = useInvalidateGarage();
  const errorMessage = useErrorMessage();

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        render={
          <EntryDialogLink
            entry={{ car: visit.carId, dialog: "service", id: visit.id }}
          />
        }
        nativeButton={false}
      >
        <Pencil />
        {tc("actions.edit")}
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
              search: { tab: "timeline" },
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

/** One line naming the work: the only item, the first item + "N more", or the kind. */
const useVisitSummary = (visit: Visit): string => {
  const { t } = useTranslation("garageVisits");
  const [first, ...rest] = visit.items;

  if (first === undefined) {
    return t(`kinds.${visit.kind}`);
  }

  return rest.length === 0
    ? first.label
    : t("detail.moreItems", { count: rest.length, first: first.label });
};

const Meta = ({
  icon: Icon,
  children,
  className,
}: {
  icon: typeof CalendarDays;
  children: React.ReactNode;
  className?: string;
}) => (
  <span className={cn("inline-flex items-center gap-1.5", className)}>
    <Icon aria-hidden="true" className="size-3.5 shrink-0" />
    {children}
  </span>
);

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
  const summary = useVisitSummary(visit);

  const total =
    visit.effectiveTotalMinor === null
      ? null
      : format.money(visit.effectiveTotalMinor, visit.currency);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="flex min-w-0 flex-col gap-2">
          <h2 className="text-xl font-semibold tracking-tight">{summary}</h2>
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
            {/* Phones already show the date in the large page title. */}
            <Meta className="max-md:hidden" icon={CalendarDays}>
              {format.date(visit.date, visit.datePrecision)}
            </Meta>
            {visit.odometerKm !== null && (
              <Meta icon={Gauge}>{format.distance(visit.odometerKm)}</Meta>
            )}
            {visit.shop !== null && <Meta icon={Store}>{visit.shop}</Meta>}
            <Badge variant="outline">{t(`kinds.${visit.kind}`)}</Badge>
            {visit.byPreviousOwner && (
              <Badge variant="secondary">{t("history.previousOwner")}</Badge>
            )}
          </div>
        </div>
        <div className="shrink-0 sm:text-right">
          <p className="text-muted-foreground text-xs">{t("detail.total")}</p>
          <p
            className={
              total === null
                ? "text-muted-foreground text-sm"
                : "text-2xl font-semibold tracking-tight tabular-nums"
            }
          >
            {total ?? t("detail.noTotal")}
          </p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          {visit.items.length > 0 && (
            <Panel className="py-1" title={t("detail.items")}>
              <ul className="flex flex-col divide-y">
                {visit.items.map((item) => (
                  <li
                    className="flex justify-between gap-3 py-2.5"
                    key={item.id}
                  >
                    <span>{item.label}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {item.costMinor === null
                        ? "—"
                        : format.money(item.costMinor, visit.currency)}
                    </span>
                  </li>
                ))}
                {visit.items.length > 1 && total !== null && (
                  <li className="flex justify-between gap-3 py-2.5 font-medium">
                    <span>{t("detail.total")}</span>
                    <span className="tabular-nums">{total}</span>
                  </li>
                )}
              </ul>
            </Panel>
          )}
          {visit.notes !== null && (
            <Panel title={tc("fields.notes")}>
              <p className="max-w-prose text-sm leading-relaxed whitespace-pre-wrap">
                {visit.notes}
              </p>
            </Panel>
          )}
        </div>
        <Panel title={t("photos.title")}>
          <PhotoGallery
            owner={{ ownerId: visit.id, ownerType: "service_visit" }}
            readOnly={readOnly}
          />
        </Panel>
      </div>
    </div>
  );
};
