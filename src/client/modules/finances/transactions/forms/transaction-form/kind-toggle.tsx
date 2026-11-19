import type { TransactionKind } from "@shared/domain/finances/kinds";
import { useTranslation } from "react-i18next";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

/** Expense / Income segmented toggle. */
export const KindToggle = ({
  centered,
  kind,
  onChange,
}: {
  centered: boolean;
  kind: TransactionKind;
  onChange: (kind: string) => void;
}) => {
  const { t } = useTranslation("finances");

  return (
    <ToggleGroup
      aria-label={t("kind.label")}
      className={cn(centered && "mx-auto")}
      onValueChange={onChange}
      size="segmented"
      spacing={0.5}
      type="single"
      value={kind}
      variant="segmented"
    >
      <ToggleGroupItem value="expense">{t("kind.expense")}</ToggleGroupItem>
      <ToggleGroupItem value="income">{t("kind.income")}</ToggleGroupItem>
    </ToggleGroup>
  );
};
