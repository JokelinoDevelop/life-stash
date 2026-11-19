import { useNavigate, useSearch } from "@tanstack/react-router";

/**
 * The page of the current car tab's long list, kept in the URL (`?page=2`) so a
 * refresh or Back from a visit returns to it. Switching tabs starts at page 1.
 */
export const useTabPage = () => {
  const { page } = useSearch({ from: "/_app/garage/cars/$carId/" });
  const navigate = useNavigate({ from: "/garage/cars/$carId/" });

  const setPage = (next: number) => {
    void navigate({
      replace: true,
      resetScroll: false,
      search: ({ page: _current, ...rest }) =>
        next > 1 ? { ...rest, page: next } : rest,
    });
  };

  return { page: page ?? 1, setPage };
};
