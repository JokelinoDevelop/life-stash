import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";
import { api, unwrap } from "@/lib/api";
import { useErrorMessage } from "@/lib/errors";
import { disablePush, enablePush, isPushSupported } from "@/lib/push";
import { useConfig } from "@/lib/session";
import { useUpdateFitnessSettings } from "@/modules/fitness/fitness.mutations";
import { fitnessSettingsQuery } from "@/modules/fitness/fitness.queries";

import {
  RowValueSkeleton,
  SettingsActionRow,
  SettingsRow,
  SettingsSection,
} from "./settings-section";
import { pushSubscriptionQuery } from "./settings.queries";

/** "Training reminders": the morning push listing today's trainings (Fitness, per user). */
const TrainingRemindersRow = () => {
  const { t } = useTranslation("settings");
  const settings = useQuery(fitnessSettingsQuery);
  const update = useUpdateFitnessSettings();

  return (
    <SettingsRow
      description={t("notifications.trainingRemindersHint")}
      htmlFor="training-reminders"
      label={t("notifications.trainingReminders")}
    >
      {settings.data === undefined ? (
        <RowValueSkeleton />
      ) : (
        <Switch
          checked={settings.data.reminders}
          disabled={update.isPending}
          id="training-reminders"
          onCheckedChange={(checked) => {
            update.mutate(checked);
          }}
        />
      )}
    </SettingsRow>
  );
};

/**
 * Notifications: push on this device (a switch, or why it isn't available),
 * a test once it's on, and training reminders.
 */
export const NotificationsCard = () => {
  const { t } = useTranslation("settings");
  const queryClient = useQueryClient();
  const errorMessage = useErrorMessage();
  const config = useConfig();
  const supported = isPushSupported();
  const subscription = useQuery(pushSubscriptionQuery);

  const refresh = async () => {
    await queryClient.invalidateQueries({
      queryKey: pushSubscriptionQuery.queryKey,
    });
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
  const on = subscription.data === true;
  let unavailable: string | undefined;

  if (!supported) {
    unavailable = t("notifications.unsupported");
  } else if (config.isSuccess && publicKey === null) {
    unavailable = t("notifications.notConfigured");
  }

  let control: React.ReactNode = <RowValueSkeleton />;

  if (unavailable !== undefined) {
    control = null;
  } else if (subscription.data !== undefined && config.data !== undefined) {
    control = (
      <Switch
        checked={on}
        disabled={enable.isPending || disable.isPending}
        id="push-device"
        onCheckedChange={(checked) => {
          if (!checked) {
            disable.mutate();
          } else if (publicKey !== null) {
            enable.mutate(publicKey);
          }
        }}
      />
    );
  }

  return (
    <SettingsSection
      description={t("notifications.description")}
      flush
      title={t("notifications.title")}
    >
      <SettingsRow
        description={unavailable}
        htmlFor={unavailable === undefined ? "push-device" : undefined}
        label={t("notifications.thisDevice")}
      >
        {control}
      </SettingsRow>
      {on && (
        <SettingsActionRow
          icon={<Send />}
          label={t("notifications.test")}
          onClick={() => {
            if (!test.isPending) {
              test.mutate();
            }
          }}
          trailing={null}
        />
      )}
      <TrainingRemindersRow />
    </SettingsSection>
  );
};
