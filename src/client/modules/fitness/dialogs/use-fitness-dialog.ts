import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter, useSearch } from "@tanstack/react-router";

import { withoutFitnessDialog } from "./fitness-dialog-search";
import type { FitnessDialogTarget } from "./fitness-dialog-search";
import { prefetchFitnessDialog } from "./prefetch-fitness-dialog";

/** The fitness dialog keys of the current URL. */
export const useFitnessDialogSearch = () =>
  useSearch({
    from: "/_app",
    select: (search) => ({
      date: search.date,
      dialog: search.dialog,
      id: search.id,
      schedule: search.schedule,
    }),
  });

/** Opens and closes Fitness dialogs over whatever page is showing (Back closes them). */
export const useFitnessDialog = () => {
  const navigate = useNavigate();
  const router = useRouter();
  const client = useQueryClient();

  const open = async (target: FitnessDialogTarget): Promise<void> => {
    await prefetchFitnessDialog(client, target);
    await navigate({
      search: (prev) => ({ ...withoutFitnessDialog(prev), ...target }),
      state: { entryDialog: true },
      to: ".",
    });
  };

  const close = async (): Promise<void> => {
    if (router.state.location.state.entryDialog === true) {
      router.history.back();

      return;
    }

    await navigate({
      replace: true,
      search: (prev) => withoutFitnessDialog(prev),
      to: ".",
    });
  };

  return { close, open };
};
