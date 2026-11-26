import type { AnyRouter, ParsedLocation } from "@tanstack/react-router";

type Location = Pick<ParsedLocation, "pathname" | "search">;

const hasDialog = (location: Location) =>
  "dialog" in location.search && location.search.dialog !== undefined;

/**
 * Opening, switching or closing a URL dialog (`?dialog=…`) on the same page.
 * The page behind shouldn't scroll for that: without this the router treats it
 * as a new page and jumps to the top, then jumps back when the dialog closes.
 */
export const isDialogToggle = (from: Location | undefined, to: Location) =>
  from !== undefined &&
  from.pathname === to.pathname &&
  (hasDialog(from) || hasDialog(to));

/**
 * The router's `scrollRestoration` option: scroll as usual, except for dialog
 * toggles. The router only passes the destination, so the origin comes from
 * `onBeforeNavigate`, which fires before scrolling is decided.
 */
export const dialogAwareScrollRestoration = () => {
  let from: Location | undefined;

  return {
    scrollRestoration: ({ location }: { location: Location }) =>
      !isDialogToggle(from, location),
    track: (router: AnyRouter) =>
      router.subscribe("onBeforeNavigate", (event) => {
        from = event.fromLocation;
      }),
  };
};
