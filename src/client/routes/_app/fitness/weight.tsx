import { addDays } from "@shared/domain/dates";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { BackLink } from "@/components/app/back-link";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { useHotkey } from "@/hooks/use-hotkey";
import { todayIso } from "@/lib/partial-date";
import { FITNESS_SHORTCUTS } from "@/lib/shortcuts";
import { cached, warm } from "@/lib/warm";
import { useFitnessDialog } from "@/modules/fitness/dialogs/use-fitness-dialog";
import { weightQuery } from "@/modules/fitness/fitness.queries";
import { WEIGHT_RANGES } from "@/modules/fitness/weight/weight-ranges";
import { WeightView } from "@/modules/fitness/weight/weight-view";

const DEFAULT_RANGE = "90";

const searchSchema = z.object({
  page: z.coerce.number().int().min(2).optional().catch(undefined),
  range: z.enum(WEIGHT_RANGES).optional().catch(undefined),
});

const WeightPage = () => {
  const { t } = useTranslation("fitness");
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const dialog = useFitnessDialog();

  const logWeight = () => {
    void dialog.open({ dialog: "weight" });
  };

  useHotkey(FITNESS_SHORTCUTS.logWeight, logWeight);

  return (
    <>
      <PageHeader
        actions={
          <>
            <Button
              className="hidden md:inline-flex"
              onClick={logWeight}
              size="compact"
            >
              <Plus />
              {t("weight.add")}
              <Kbd>{FITNESS_SHORTCUTS.logWeight.toUpperCase()}</Kbd>
            </Button>
            <Button
              aria-label={t("weight.add")}
              className="md:hidden"
              onClick={logWeight}
              size="icon-compact"
              variant="ghost"
            >
              <Plus />
            </Button>
          </>
        }
        back={<BackLink label={t("title")} to="/fitness" />}
        title={t("nav.weight")}
      />
      <WeightView
        onPageChange={(page) => {
          void navigate({
            search: ({ page: _page, ...prev }) =>
              page > 1 ? { ...prev, page } : prev,
          });
        }}
        onRangeChange={(range) => {
          void navigate({
            replace: true,
            search: ({ page: _page, range: _range, ...prev }) =>
              range === DEFAULT_RANGE ? prev : { ...prev, range },
          });
        }}
        page={search.page ?? 1}
        range={search.range ?? DEFAULT_RANGE}
        today={todayIso()}
      />
    </>
  );
};

export const Route = createFileRoute("/_app/fitness/weight")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ range: search.range }),
  loader: async ({ context: { queryClient }, deps }) => {
    const today = todayIso();
    const days = Number(deps.range ?? DEFAULT_RANGE);

    await warm(
      queryClient.query(cached(weightQuery(addDays(today, -days), today)))
    );
  },
  component: WeightPage,
});
