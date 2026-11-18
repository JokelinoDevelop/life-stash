import { useTranslation } from "react-i18next";

import { useErrorMessage } from "@/lib/errors";
import { PasskeyError } from "@/lib/passkeys";

export const usePasskeyErrorMessage = () => {
  const { t } = useTranslation("auth");
  const apiMessage = useErrorMessage();

  return (error: unknown): string => {
    if (error instanceof PasskeyError) {
      return t(`errors.${error.reason}`);
    }

    return apiMessage(error);
  };
};
