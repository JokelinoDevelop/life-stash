import { useRef, useState } from "react";
import type { ReactElement, ReactNode } from "react";

import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

import { useIsDesktop } from "./responsive-dialog";

/** One button revealed behind a row when it is swiped left. */
export interface SwipeAction {
  label: string;
  icon?: ReactNode;
  tone: "neutral" | "success" | "destructive";
  onSelect: () => void;
}

/** Width of each revealed action, in px. */
const ACTION_WIDTH = 80;
const START_THRESHOLD = 8;

const TONE = {
  destructive: "bg-destructive text-white",
  neutral: "bg-muted-foreground text-white",
  success: "bg-success text-white",
} as const;

/**
 * Phones: swipe a row left to reveal its actions (the last one sits at the
 * edge); tap one to run it. The row's own tap still works, and a tap while the
 * actions show just closes them. Desktop renders the row as is: its actions
 * live in buttons and menus.
 */
export const SwipeActions = ({
  actions,
  children,
}: {
  actions: readonly SwipeAction[];
  children: ReactElement;
}) => {
  const isDesktop = useIsDesktop();
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; y: number; base: number } | null>(null);
  const swiping = useRef(false);
  const armed = useRef(false);
  const reveal = ACTION_WIDTH * actions.length;

  if (isDesktop || actions.length === 0) {
    return children;
  }

  const open = offset !== 0;

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden={!open}
        className="absolute inset-y-0 right-0 flex w-(--reveal)"
        style={{ "--reveal": `${reveal}px` }}
      >
        {actions.map((action) => (
          <button
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium [&_svg]:size-5",
              TONE[action.tone]
            )}
            key={action.label}
            onClick={() => {
              setOffset(0);
              action.onSelect();
            }}
            tabIndex={open ? 0 : -1}
            type="button"
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
      <div
        className={cn(
          "bg-card relative translate-x-(--swipe-x) touch-pan-y",
          !dragging && "transition-transform duration-200 ease-(--ease-slide)"
        )}
        onClickCapture={(event) => {
          if (swiping.current || open) {
            event.preventDefault();
            event.stopPropagation();
            swiping.current = false;
            setOffset(0);
          }
        }}
        onPointerCancel={() => {
          start.current = null;
          setDragging(false);
          setOffset(0);
        }}
        onPointerDown={(event) => {
          start.current = { base: offset, x: event.clientX, y: event.clientY };
          swiping.current = false;
          armed.current = offset !== 0;
        }}
        onPointerMove={(event) => {
          if (start.current === null) {
            return;
          }

          const dx = event.clientX - start.current.x;
          const dy = event.clientY - start.current.y;

          if (
            !swiping.current &&
            Math.abs(dx) > START_THRESHOLD &&
            Math.abs(dx) > Math.abs(dy)
          ) {
            swiping.current = true;
            setDragging(true);
          }

          if (swiping.current) {
            const next = Math.min(
              0,
              Math.max(-reveal, start.current.base + dx)
            );

            const past = next < -reveal / 2;

            if (past !== armed.current) {
              armed.current = past;
              haptic("tick");
            }

            setOffset(next);
          }
        }}
        onPointerUp={() => {
          start.current = null;
          setDragging(false);
          setOffset((current) => (current < -reveal / 2 ? -reveal : 0));
        }}
        style={{ "--swipe-x": `${offset}px` }}
      >
        {children}
      </div>
    </div>
  );
};
