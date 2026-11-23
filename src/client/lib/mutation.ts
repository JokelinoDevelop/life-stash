import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useErrorMessage } from "./errors";

type SuccessMessage<TVariables, TData> = (
  data: TData,
  variables: TVariables
) => string;

interface AppMutationOptions<TVariables, TData> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  /** Query keys to invalidate after success. */
  invalidate: readonly QueryKey[];
  /** The success toast; `false` for none (or use `successFor`). */
  success: string | false;
  /** A success toast that depends on the result or input; wins over `success`. */
  successFor?: SuccessMessage<TVariables, TData>;
  /** Adds "Undo" to the success toast; runs the inverse mutation. */
  undo?: (data: TData, variables: TVariables) => Promise<object>;
  /** Adds an action button (e.g. "View") to the success toast. */
  action?: (
    data: TData,
    variables: TVariables
  ) => { label: string; onClick: () => void };
  /** Return true when the error was shown elsewhere (e.g. on a form field) so no toast appears. */
  onError?: (error: Error) => boolean;
  /** Cache edits applied before the request so the UI updates at once; rolled back on error. */
  optimistic?: readonly OptimisticUpdate<TVariables>[];
}

/** One cache edit for `optimistic`; build it with `optimisticUpdate`. */
export interface OptimisticUpdate<TVariables> {
  queryKey: QueryKey;
  apply: (queryClient: QueryClient, variables: TVariables) => void;
}

/**
 * Edits every cached query under `queryKey` (a prefix) while the mutation runs.
 * `update` receives the cached value; it must return a new one, not mutate it.
 */
export const optimisticUpdate = <TData, TVariables>(
  queryKey: QueryKey,
  update: (data: TData, variables: TVariables) => TData
): OptimisticUpdate<TVariables> => ({
  apply: (queryClient, variables) => {
    queryClient.setQueriesData<TData>({ queryKey }, (data) =>
      data === undefined ? data : update(data, variables)
    );
  },
  queryKey,
});

/**
 * Every mutation shows exactly one toast: success (optionally with Undo or an action) or the
 * translated error. Invalidates the given queries after success and after an undo.
 */
export const useAppMutation = <TVariables = void, TData = unknown>({
  action,
  invalidate,
  mutationFn,
  onError,
  optimistic = [],
  success,
  successFor,
  undo,
}: AppMutationOptions<TVariables, TData>) => {
  const queryClient = useQueryClient();
  const errorMessage = useErrorMessage();
  const { t } = useTranslation();

  const refresh = async () => {
    await Promise.all(
      invalidate.map(async (queryKey) => {
        await queryClient.invalidateQueries({ queryKey });
      })
    );
  };

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      if (optimistic.length === 0) {
        return { snapshots: [] };
      }

      await Promise.all(
        optimistic.map(async ({ queryKey }) => {
          await queryClient.cancelQueries({ queryKey });
        })
      );

      const snapshots = optimistic.flatMap(({ apply, queryKey }) => {
        const before = queryClient.getQueriesData({ queryKey });
        apply(queryClient, variables);

        return before;
      });

      return { snapshots };
    },
    onError: (error, _variables, context) => {
      // The snapshot predates this mutation only; if others are still running,
      // restoring it would undo their optimistic edits, so refetch instead.
      if (queryClient.isMutating() <= 1) {
        for (const [key, data] of context?.snapshots ?? []) {
          queryClient.setQueryData(key, data);
        }
      }

      if (optimistic.length > 0) {
        void refresh();
      }

      if (onError?.(error) !== true) {
        toast.error(errorMessage(error));
      }
    },
    onSuccess: async (data, variables) => {
      await refresh();

      const message = successFor?.(data, variables) ?? success;

      if (message === false) {
        return;
      }

      if (undo !== undefined) {
        toast.success(message, {
          action: {
            label: t("actions.undo"),
            onClick: () => {
              void (async () => {
                try {
                  await undo(data, variables);
                  await refresh();
                } catch (error) {
                  toast.error(errorMessage(error));
                }
              })();
            },
          },
        });

        return;
      }

      toast.success(
        message,
        action === undefined ? undefined : { action: action(data, variables) }
      );
    },
  });
};
