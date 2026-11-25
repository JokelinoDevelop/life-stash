import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter, useSearch } from "@tanstack/react-router";

import { withoutEntryDialog } from "./entry-dialog-search";
import type { EntryDialogTarget } from "./entry-dialog-search";
import { prefetchEntryDialog } from "./prefetch-entry-dialog";

declare module "@tanstack/react-router" {
  interface HistoryState {
    /** Set on the history entry an in-app click pushed to open an entry dialog. */
    entryDialog?: true;
  }
}

/** The entry dialog search keys of the current URL. */
export const useEntryDialogSearch = () =>
  useSearch({
    from: "/_app",
    select: (search) => ({
      car: search.car,
      dialog: search.dialog,
      id: search.id,
      reminder: search.reminder,
    }),
  });

/** Opens and closes the create/edit dialogs over whatever page is showing. */
export const useEntryDialog = () => {
  const navigate = useNavigate();
  const router = useRouter();
  const client = useQueryClient();

  /** Waits briefly for the form's data, so the dialog opens at its final size. */
  const open = async (target: EntryDialogTarget): Promise<void> => {
    await prefetchEntryDialog(client, target);
    await navigate({
      search: (prev) => ({ ...withoutEntryDialog(prev), ...target }),
      state: { entryDialog: true },
      to: ".",
    });
  };

  /** Back when we pushed the dialog's entry (so Back doesn't reopen it), else drop the keys. */
  const close = async (): Promise<void> => {
    if (router.state.location.state.entryDialog === true) {
      router.history.back();

      return;
    }

    await navigate({
      replace: true,
      search: (prev) => withoutEntryDialog(prev),
      to: ".",
    });
  };

  return { close, open };
};
