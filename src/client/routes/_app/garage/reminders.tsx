import { createFileRoute, redirect } from "@tanstack/react-router";

/** Reminders across the household now live on Today. */
export const Route = createFileRoute("/_app/garage/reminders")({
  beforeLoad: () => {
    throw redirect({ replace: true, to: "/" });
  },
});
