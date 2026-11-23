import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { registerSW } from "virtual:pwa-register";

const CHECK_EVERY_MS = 60 * 60 * 1000;

const noCleanup = () => {
  // Nothing was registered.
};

/**
 * Registers the service worker and offers a reload when a new version is ready. Tabs left open
 * check for a new deploy every hour and whenever they come back into view.
 */
export const UpdatePrompt = () => {
  const { t } = useTranslation();
  useEffect(() => {
    if (!("serviceWorker" in navigator) || import.meta.env.DEV) {
      return noCleanup;
    }

    let registration: ServiceWorkerRegistration | undefined;

    const check = () => {
      if (registration && navigator.onLine) {
        registration.update().catch(() => {
          // Offline or the server is unreachable: try again on the next check.
        });
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        check();
      }
    };

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
          id: "app-update",
        });
      },
      onRegisteredSW: (_url, reg) => {
        registration = reg;
      },
    });

    const timer = setInterval(check, CHECK_EVERY_MS);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [t]);

  return null;
};
