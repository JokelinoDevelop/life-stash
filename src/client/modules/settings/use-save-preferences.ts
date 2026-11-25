import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { setLocale } from "@/i18n";
import { api, unwrap } from "@/lib/api";
import { useErrorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/query-keys";
import { preferencesQuery } from "@/lib/session";

import { preferencesToRequest, undoPatch } from "./preferences-form/mapper";
import type { Preferences, PreferencesPatch } from "./preferences-form/mapper";

interface SaveVariables {
  patch: PreferencesPatch;
  /** An undo shows no "Saved" toast of its own. */
  silent?: boolean;
}

/**
 * Saves one preference the moment it changes: the screen updates at once
 * (optimistic), a "Saved" toast offers Undo, and a failure puts the old value back.
 */
export const useSavePreferences = () => {
  const { t } = useTranslation("settings");
  const queryClient = useQueryClient();
  const errorMessage = useErrorMessage();

  const mutation = useMutation<
    unknown,
    Error,
    SaveVariables,
    { previous: Preferences | undefined }
  >({
    mutationFn: async ({ patch }: SaveVariables) => {
      const current = queryClient.getQueryData(preferencesQuery.queryKey);

      if (current === undefined) {
        throw new Error("Preferences are not loaded yet");
      }

      return await unwrap(
        api.settings.preferences.$put({
          json: preferencesToRequest(current, patch),
        })
      );
    },
    onError: (error, _variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(preferencesQuery.queryKey, context.previous);
      }

      toast.error(errorMessage(error));
    },
    onMutate: async ({ patch }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.preferences });
      const previous = queryClient.getQueryData(preferencesQuery.queryKey);

      if (previous !== undefined) {
        queryClient.setQueryData(preferencesQuery.queryKey, {
          ...previous,
          ...patch,
        });
      }

      if (patch.locale !== undefined) {
        await setLocale(patch.locale);
      }

      return { previous };
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.preferences });
      await queryClient.invalidateQueries({ queryKey: queryKeys.authStatus });
    },
    onSuccess: (_data, { patch, silent }, context) => {
      if (silent === true || context.previous === undefined) {
        return;
      }

      const { previous } = context;

      toast.success(t("preferences.saved"), {
        action: {
          label: t("preferences.undo"),
          onClick: () => {
            mutation.mutate({
              patch: undoPatch(previous, patch),
              silent: true,
            });
          },
        },
      });
    },
  });

  return {
    isPending: mutation.isPending,
    save: (patch: PreferencesPatch) => {
      mutation.mutate({ patch });
    },
  };
};
