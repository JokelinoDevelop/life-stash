import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api, unwrap } from "@/lib/api";
import { useErrorMessage } from "@/lib/errors";
import {
  currentPushSubscription,
  disablePush,
  enablePush,
  isPushSupported,
} from "@/lib/push";
import { useConfig } from "@/lib/session";
import { useUpdateFitnessSettings } from "@/modules/fitness/fitness.mutations";
import { fitnessSettingsQuery } from "@/modules/fitness/fitness.queries";

import { SettingsSection } from "./settings-section";

const PUSH_KEY = ["settings", "push-subscription"] as const;

/** "Training reminders": the morning push listing today's trainings (Fitness, per user). */
const TrainingRemindersRow = () => {
  const { t } = useTranslation("settings");
  const settings = useQuery(fitnessSettingsQuery);
  const update = useUpdateFitnessSettings();

  return (
    <div className="border-divider mt-4 flex items-center justify-between gap-4 border-t pt-4">
      <div className="flex min-w-0 flex-col gap-0.5">
        <Label htmlFor="training-reminders">
          {t("notifications.trainingReminders")}
        </Label>
        <p className="text-muted-foreground text-sm">
          {t("notifications.trainingRemindersHint")}
        </p>
      </div>
      <Switch
        checked={settings.data?.reminders ?? false}
        disabled={settings.isPending || update.isPending}
        id="training-reminders"
        onCheckedChange={(checked) => {
          update.mutate(checked);
        }}
      />
    </div>
  );
};

export const NotificationsCard = () => {
  const { t } = useTranslation("settings");
  const queryClient = useQueryClient();
  const errorMessage = useErrorMessage();
  const config = useConfig();
  const supported = isPushSupported();

  const subscription = useQuery({
    enabled: supported,
    queryFn: async () => (await currentPushSubscription()) !== null,
    queryKey: PUSH_KEY,
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: PUSH_KEY });
  };

  const enable = useMutation({
    mutationFn: async (publicKey: string) => await enablePush(publicKey),
    onError: (error) => toast.error(errorMessage(error)),
    onSuccess: async (permission) => {
      if (permission === "denied") {
        toast.error(t("notifications.denied"));
      }

      await refresh();
    },
  });

  const disable = useMutation({
    mutationFn: disablePush,
    onError: (error) => toast.error(errorMessage(error)),
    onSuccess: refresh,
  });

  const test = useMutation({
    mutationFn: async () => await unwrap(api.settings.push.test.$post()),
    onError: (error) => toast.error(errorMessage(error)),
    onSuccess: () => toast.success(t("notifications.testSent")),
  });

  const publicKey = config.data?.pushPublicKey ?? null;

  const body = () => {
    if (!supported) {
      return (
        <p className="text-muted-foreground text-sm">
          {t("notifications.unsupported")}
        </p>
      );
    }

    if (config.isSuccess && publicKey === null) {
      return (
        <p className="text-muted-foreground text-sm">
          {t("notifications.notConfigured")}
        </p>
      );
    }

    if (subscription.data === true) {
      return (
        <div className="flex flex-col gap-3">
          <p className="text-sm">{t("notifications.enabled")}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={test.isPending}
              onClick={() => {
                test.mutate();
              }}
              variant="outline"
            >
              <Send />
              {t("notifications.test")}
            </Button>
            <Button
              disabled={disable.isPending}
              onClick={() => {
                disable.mutate();
              }}
              variant="ghost"
            >
              <BellOff />
              {t("notifications.disable")}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <Button
        className="self-start"
        disabled={enable.isPending || publicKey === null}
        onClick={() => {
          if (publicKey !== null) {
            enable.mutate(publicKey);
          }
        }}
      >
        <Bell />
        {t("notifications.enable")}
      </Button>
    );
  };

  return (
    <SettingsSection
      title={t("notifications.title")}
      description={t("notifications.description")}
    >
      <div className="flex flex-col">
        {body()}
        <TrainingRemindersRow />
      </div>
    </SettingsSection>
  );
};
