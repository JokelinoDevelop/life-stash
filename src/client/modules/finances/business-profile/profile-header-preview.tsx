import { useTranslation } from "react-i18next";

import type { BusinessProfileFormValues } from "./forms/business-profile-form/schema";

/** The top-left of an invoice as it will print: name, address, tax ID · email · phone. */
export const ProfileHeaderPreview = ({
  values,
}: {
  values: BusinessProfileFormValues;
}) => {
  const { t } = useTranslation("finances");

  const contact = [values.taxId, values.email, values.phone]
    .flatMap((part) => (part.trim() === "" ? [] : [part.trim()]))
    .join(" · ");

  return (
    <figure
      aria-label={t("profile.preview")}
      className="bg-background flex items-start justify-between gap-4 rounded-md border px-4 py-3"
    >
      <div className="min-w-0 text-sm">
        <p className="truncate font-semibold">
          {values.name.trim() === ""
            ? t("profile.namePlaceholder")
            : values.name}
        </p>
        {values.address.trim() !== "" && (
          <p className="text-subtle-foreground whitespace-pre-line">
            {values.address.trim()}
          </p>
        )}
        {contact !== "" && (
          <p className="text-muted-foreground truncate tabular-nums">
            {contact}
          </p>
        )}
      </div>
      <figcaption className="text-muted-foreground shrink-0 text-xs font-semibold tracking-wide uppercase">
        {t("profile.invoiceWord")}
      </figcaption>
    </figure>
  );
};
