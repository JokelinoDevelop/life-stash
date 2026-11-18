import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { registerSW } from "virtual:pwa-register";

/** Registers the service worker and offers a reload when a new version is ready. */
export const UpdatePrompt = () => {
  const { t } = useTranslation();
  useEffect(() => {
    if (!("serviceWorker" in navigator) || import.meta.env.DEV) {
      return;
    }

    const updateServiceWorker = registerSW({
      onNeedRefresh: () => {
        toast(t("update.available"), {
          action: {
            label: t("update.reload"),
            onClick: () => {
              void updateServiceWorker(true);
            },
          },
          duration: Number.POSITIVE_INFINITY,
        });
      },
    });
  }, [t]);

  return null;
};
