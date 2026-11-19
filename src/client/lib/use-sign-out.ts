import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { api, unwrap } from "./api";

/** Ends the session, drops cached data and returns to the login screen. */
export const useSignOut = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return async () => {
    await unwrap(api.auth.logout.$post());
    queryClient.clear();
    await navigate({ to: "/login" });
  };
};
