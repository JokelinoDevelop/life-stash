import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Today with nothing to do. `full`: the whole page (a calm success mark in
 * soft rings, a title and one line); `compact`: a one-line card above "Later".
 */
export const AllClear = ({ compact = false }: { compact?: boolean }) => {
  const { t } = useTranslation("today");

  if (compact) {
    return (
      <div className="surface bg-card flex items-center gap-3 rounded-lg border px-3.5 py-3 md:mx-5 md:my-4">
        <span className="bg-success/15 text-success-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
          <Check className="size-4" strokeWidth={2.5} />
        </span>
        <p className="text-subtle-foreground text-sm">
          {t("allClear.compact")}
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade flex flex-col items-center px-6 pt-10 pb-6 text-center md:pt-20">
      <span className="bg-success/8 flex size-36 items-center justify-center rounded-full">
        <span className="bg-success/12 flex size-24 items-center justify-center rounded-full">
          <span className="bg-success flex size-14 items-center justify-center rounded-full text-white shadow-lg">
            <Check className="size-7" strokeWidth={3} />
          </span>
        </span>
      </span>
      <h2 className="mt-6 text-xl font-semibold tracking-tight">
        {t("allClear.title")}
      </h2>
      <p className="text-muted-foreground mt-1.5 max-w-xs text-sm">
        {t("allClear.message")}
      </p>
    </div>
  );
};
