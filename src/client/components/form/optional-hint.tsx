import { useTranslation } from "react-i18next";

export const OptionalHint = () => {
  const { t } = useTranslation();

  return (
    <span className="text-muted-foreground text-xs font-normal">
      ({t("fields.optional")})
    </span>
  );
};
