import { useRouter } from "@tanstack/react-router";
import type { RegisteredRouter } from "@tanstack/react-router";
import type { RefObject } from "react";
import { useEffect } from "react";

import { markAlreadyAnimated } from "@/lib/nav-transition";

type Router = RegisteredRouter;

/** Touches that start this close to the left edge can swipe back. */
const EDGE = 24;

/** Commit when dragged this share of the width, or flicked faster than this (px/ms). */
const COMMIT_SHARE = 0.35;
const COMMIT_VELOCITY = 0.45;
const SETTLE = "transform 220ms cubic-bezier(0.32, 0.72, 0, 1)";
const SHADOW = "-12px 0 32px rgb(0 0 0 / 0.12)";

/** iOS home-screen app only: Safari's own swipe works in the browser, but not once installed. */
const isInstalledIos = () =>
  "standalone" in navigator && navigator.standalone === true;

const setOffset = (page: HTMLElement, offset: number, transition = "none") => {
  page.style.transition = transition;
  page.style.transform = offset === 0 ? "" : `translateX(${offset}px)`;
  page.style.boxShadow = offset === 0 ? "" : SHADOW;
};

/** A one-finger touch at the left edge of a screen that has somewhere to go back to. */
const canStart = (event: TouchEvent, router: Router) => {
  const [touch] = event.touches;

  if (event.touches.length !== 1 || touch === undefined) {
    return false;
  }

  const depth = router.state.location.pathname
    .split("/")
    .filter(Boolean).length;

  return touch.clientX <= EDGE && depth > 1 && router.history.canGoBack();
};

/** Slide the page away, go back, and show the previous screen once it has rendered. */
const commitBack = (page: HTMLElement, router: Router) => {
  setOffset(page, page.getBoundingClientRect().width, SETTLE);
  page.addEventListener(
    "transitionend",
    () => {
      page.style.opacity = "0";

      const unsubscribe = router.subscribe("onResolved", () => {
        unsubscribe();
        setOffset(page, 0);
        page.style.transition = "opacity 120ms ease-out";
        page.style.opacity = "";
      });

      markAlreadyAnimated();
      router.history.back();
    },
    { once: true }
  );
};

/**
 * Drag from the left edge to go back, like a native stack: the page follows
 * the finger, then slides away (or springs back if the swipe was short).
 */
export const useSwipeBack = (target: RefObject<HTMLElement | null>) => {
  const router = useRouter();

  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let dx = 0;
    let tracking = false;
    let dragging = false;

    const onStart = (event: TouchEvent) => {
      tracking =
        target.current !== null && isInstalledIos() && canStart(event, router);

      const [touch] = event.touches;

      if (tracking && touch !== undefined) {
        startX = touch.clientX;
        startY = touch.clientY;
        startTime = event.timeStamp;
        dx = 0;
        dragging = false;
      }
    };

    const onMove = (event: TouchEvent) => {
      const [touch] = event.touches;
      const page = target.current;

      if (!tracking || touch === undefined || page === null) {
        return;
      }

      const moveX = touch.clientX - startX;
      const moveY = touch.clientY - startY;

      // Decide once: a mostly vertical move is a scroll, not a swipe.
      if (!dragging && Math.abs(moveY) > Math.abs(moveX)) {
        tracking = false;

        return;
      }

      dragging ||= moveX > 6;

      if (dragging) {
        event.preventDefault();
        dx = Math.max(0, moveX);
        setOffset(page, dx);
      }
    };

    const onEnd = (event: TouchEvent) => {
      const page = target.current;
      const wasDragging = dragging;
      tracking = false;
      dragging = false;

      if (!wasDragging || page === null) {
        return;
      }

      const { width } = page.getBoundingClientRect();
      const velocity = dx / Math.max(1, event.timeStamp - startTime);

      if (dx < width * COMMIT_SHARE && velocity < COMMIT_VELOCITY) {
        setOffset(page, 0, SETTLE);
      } else {
        commitBack(page, router);
      }
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
    document.addEventListener("touchcancel", onEnd);

    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onEnd);
    };
  }, [router, target]);
};
