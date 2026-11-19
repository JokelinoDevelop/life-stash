import { useTranslation } from "react-i18next";

/** A category's display name; system categories are translated rather than stored text. */
export const useCategoryName = () => {
  const { t } = useTranslation("finances");

  return (category: { name: string; systemKey: "invoices" | null }): string =>
    category.systemKey === null
      ? category.name
      : t(`categories.systemNames.${category.systemKey}`);
};
