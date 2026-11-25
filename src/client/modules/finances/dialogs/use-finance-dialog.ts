import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter, useSearch } from "@tanstack/react-router";

import { withoutFinanceDialog } from "./finance-dialog-search";
import type { FinanceDialogTarget } from "./finance-dialog-search";
import { prefetchFinanceDialog } from "./prefetch-finance-dialog";

/** The finance dialog keys of the current URL. */
export const useFinanceDialogSearch = () =>
  useSearch({
    from: "/_app",
    select: (search) => ({
      dialog: search.dialog,
      duplicate: search.duplicate,
      id: search.id,
      entryKind: search.entryKind,
      forClient: search.forClient,
    }),
  });

/** Opens and closes Finances dialogs over whatever page is showing (Back closes them). */
export const useFinanceDialog = () => {
  const navigate = useNavigate();
  const router = useRouter();
  const client = useQueryClient();

  const open = async (target: FinanceDialogTarget): Promise<void> => {
    await prefetchFinanceDialog(client, target);
    await navigate({
      search: (prev) => ({ ...withoutFinanceDialog(prev), ...target }),
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
      search: (prev) => withoutFinanceDialog(prev),
      to: ".",
    });
  };

  return { close, open };
};
