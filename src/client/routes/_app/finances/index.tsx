import { createFileRoute, redirect } from "@tanstack/react-router";

/** The Finances home; until the overview arrives it opens the ledger. */
export const Route = createFileRoute("/_app/finances/")({
  beforeLoad: () => {
    throw redirect({ replace: true, to: "/finances/transactions" });
  },
});
