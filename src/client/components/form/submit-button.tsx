import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { useFormContext } from "./form-context";

export const SubmitButton = ({
  label,
  className,
  size,
}: {
  label?: string;
  className?: string;
  /** `submit`: a sheet's full-width primary on phones (pair with `w-full md:w-auto`). */
  size?: "default" | "submit" | "block";
}) => {
  const form = useFormContext();
  const { t } = useTranslation();

  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button
          className={className}
          disabled={isSubmitting}
          size={size}
          type="submit"
        >
          {isSubmitting && <Loader2 className="animate-spin" />}
          {isSubmitting ? t("actions.saving") : (label ?? t("actions.save"))}
        </Button>
      )}
    </form.Subscribe>
  );
};
