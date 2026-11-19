import { useRef, useState } from "react";
import type { ReactElement } from "react";

import { useIsDesktop } from "@/components/app/responsive-dialog";

const REVEAL = 88;
const START_THRESHOLD = 8;

/**
 * Phones: swipe a row left to reveal Delete; tapping it deletes (an Undo toast follows).
 * Desktop renders the row as is.
 */
export const SwipeToDelete = ({
  children,
  label,
  onDelete,
}: {
  children: ReactElement;
  label: string;
  onDelete: () => void;
}) => {
  const isDesktop = useIsDesktop();
  const [offset, setOffset] = useState(0);
  const start = useRef<{ x: number; y: number; base: number } | null>(null);
  const swiping = useRef(false);

  if (isDesktop) {
    return children;
  }

  return (
    <div className="relative overflow-hidden">
      <button
        aria-hidden={offset === 0}
        className="bg-destructive absolute inset-y-0 right-0 flex w-22 items-center justify-center text-sm font-medium text-white"
        onClick={() => {
          setOffset(0);
          onDelete();
        }}
        tabIndex={offset === 0 ? -1 : 0}
        type="button"
      >
        {label}
      </button>
      <div
        className="relative translate-x-(--swipe-x) touch-pan-y transition-transform duration-150 ease-out"
        onClickCapture={(event) => {
          if (swiping.current || offset !== 0) {
            event.preventDefault();
            event.stopPropagation();
            swiping.current = false;
            setOffset(0);
          }
        }}
        onPointerCancel={() => {
          start.current = null;
        }}
        onPointerDown={(event) => {
          start.current = { base: offset, x: event.clientX, y: event.clientY };
          swiping.current = false;
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
          }

          if (swiping.current) {
            setOffset(Math.min(0, Math.max(-REVEAL, start.current.base + dx)));
          }
        }}
        onPointerUp={() => {
          start.current = null;
          setOffset((current) => (current < -REVEAL / 2 ? -REVEAL : 0));
        }}
        style={{ "--swipe-x": `${offset}px` }}
      >
        {children}
      </div>
    </div>
  );
};
